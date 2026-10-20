import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { safeStorage } from '../lib/safeStorage'
import { useUi } from '../context/UiProvider'
import {
  LIST_PREFS_STORAGE_PREFIX,
  listPrefsEqual,
  normalizeListPrefs,
  resolveListDefaults,
  type ListPrefs,
  type ListPrefsDefaults,
  type ListSort,
} from './listPrefs'
import { localOnlyListPrefsStore, type ListPrefsStore } from './stores'

/** Debounce de la escritura remota de los anchos (un arrastre son decenas de cambios). */
export const LIST_PREFS_WIDTHS_DEBOUNCE_MS = 400

// ---------------------------------------------------------------------------
// Caché local como external store (useSyncExternalStore).
//
// Hidratación (Next SSR): el servidor no tiene localStorage, así que su
// snapshot es siempre `null` (= preferencias por defecto). React usa ese mismo
// snapshot al hidratar y, justo después, vuelve a renderizar con el del
// cliente: sin desajuste de markup ni setState en efectos. En una SPA (Vite)
// no hay hidratación y el primer render ya lee la caché.
//
// Claves (v0.8.0), según `store.userId`:
// - usuario con sesión (`string`): `list-prefs:<userId>:<listKey>`. En un PC
//   compartido cada usuario pinta con LO SUYO, no con lo del anterior.
// - sin sesión (`null`, p. ej. `localOnlyListPrefsStore`): `list-prefs:<listKey>`,
//   la clave de siempre (preferencias del dispositivo).
// - usuario aún desconocido (`undefined`, resolviendo la sesión): NINGUNA
//   clave: se pinta con los defaults y `isLoaded` es `false`.
//
// `memory` guarda la última cadena conocida por clave de almacenamiento: da un
// snapshot estable (misma referencia mientras no cambie) y hace de caché
// cuando localStorage no está disponible (modo privado, webviews). Se vacía al
// cambiar de usuario en la misma pestaña.
// ---------------------------------------------------------------------------
const memory = new Map<string, string | null>()
const listeners = new Map<string, Set<() => void>>()
let memoryUser: string | null | undefined

/** Clave de localStorage para (usuario, lista); `null` si el usuario aún no se conoce. */
export function listPrefsStorageKey(
  userId: string | null | undefined,
  listKey: string,
): string | null {
  if (userId === undefined) return null
  if (userId === null) return `${LIST_PREFS_STORAGE_PREFIX}${listKey}`
  return `${LIST_PREFS_STORAGE_PREFIX}${userId}:${listKey}`
}

// Al aparecer otro usuario con sesión, la caché en memoria del anterior fuera.
function noteUser(userId: string | null | undefined) {
  if (typeof userId !== 'string' || userId === memoryUser) return
  if (typeof memoryUser === 'string') memory.clear()
  memoryUser = userId
}

function readSnapshot(key: string | null): string | null {
  if (key == null) return null
  if (!memory.has(key)) memory.set(key, safeStorage.getItem(key))
  return memory.get(key) ?? null
}

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb())
}

function writeLocal(key: string | null, prefs: ListPrefs) {
  // Usuario aún desconocido: no hay clave donde escribir (la lista no debería
  // ofrecer controles hasta `isLoaded`).
  if (key == null) return
  const raw = JSON.stringify(prefs)
  if (memory.get(key) === raw) return
  memory.set(key, raw)
  safeStorage.setItem(key, raw)
  notify(key)
}

// Clave vieja `list-prefs:<listKey>` (sin usuario, < v0.8.0): puede ser de
// otro usuario del mismo navegador, así que con sesión no se usa para pintar
// ni se sube; se borra cuando el servidor responde.
function dropLegacy(listKey: string) {
  const legacy = listPrefsStorageKey(null, listKey)!
  if (safeStorage.getItem(legacy) == null && !memory.get(legacy)) return
  safeStorage.removeItem(legacy)
  memory.delete(legacy)
  notify(legacy)
}

function subscribe(key: string | null, cb: () => void) {
  if (key == null) return () => {}
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(cb)
  // Otra pestaña cambió la misma lista: se refleja aquí también.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return
    memory.set(key, e.newValue)
    cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    set.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

function parse(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Solo para tests: olvida la caché en memoria (localStorage no se toca). */
export function __resetListPrefsCache() {
  memory.clear()
  memoryUser = undefined
}

export type UseListPrefsOptions = {
  /** Claves de columna que la lista conoce HOY. Todo lo demás se descarta. */
  columnKeys: readonly string[]
  /** Valores por defecto (todos opcionales: sin orden, sin ocultas, sin anchos, 25/pág.). */
  defaults?: ListPrefsDefaults
  /**
   * Dónde se sincroniza. Por defecto, el `listPrefsStore` del `UiProvider`; y
   * si tampoco hay, solo caché local.
   */
  store?: ListPrefsStore
}

export type UseListPrefsResult = {
  prefs: ListPrefs
  setHidden: (hidden: string[]) => void
  setWidths: (widths: Record<string, number>) => void
  setSort: (sort: ListSort | null) => void
  setPageSize: (pageSize: number) => void
  /** Modo compacto (al instante, sin debounce). */
  setCompact: (compact: boolean) => void
  /** Orden de las columnas (claves), al instante. `[]` = orden de serie. */
  setOrder: (order: string[]) => void
  /**
   * «Restablecer columnas»: ocultas, anchos y orden de columnas vuelven a los
   * DEFAULTS del listado (`defaults.hidden`, `defaults.widths` o `{}`,
   * `defaults.order` o `[]`), no a «todo visible»; orden de filas, tamaño de
   * página y modo compacto se conservan (la densidad no es una columna).
   */
  reset: () => void
  /**
   * Las `prefs` ya son las definitivas para pintar y consultar (v0.8.0):
   * `true` si (a) hay caché local de ESTE usuario para esta lista, (b) la
   * consulta al servidor ya terminó (con fila, sin fila o con error), o (c) no
   * hay sesión (`userId === null`, solo local). `false` mientras el usuario
   * se está resolviendo (`undefined`) o, sin caché local, hasta que responde
   * el servidor: ahí `prefs` son los defaults y la lista no debe pintarse ni
   * consultar con ellos.
   */
  isLoaded: boolean
}

/**
 * Preferencias de un listado configurable (orden, anchos, columnas ocultas,
 * orden de columnas, filas por página, modo compacto), por usuario y sincronizadas entre dispositivos.
 *
 * - Lectura: `list-prefs:<userId>:<listKey>` de localStorage (vía
 *   `safeStorage`; sin sesión, `list-prefs:<listKey>`), sin salto en el primer
 *   render de una SPA y sin error de hidratación en Next. Sin caché local de
 *   este usuario, `isLoaded` espera al servidor.
 *   Cuando llega la fila del almacén remoto, GANA (una vez por usuario y
 *   lista). Si el almacén no tiene fila y la caché local trae algo distinto del
 *   defecto, se sube la local para que el siguiente dispositivo la encuentre.
 * - Escritura: orden, ocultas, orden de columnas, tamaño de página y compacto al instante; anchos con
 *   debounce de 400 ms y flush al desmontar. La caché local se actualiza
 *   siempre, sin esperar al servidor.
 *
 * Necesita un `QueryClientProvider` de TanStack Query por encima.
 */
export function useListPrefs(
  listKey: string,
  { columnKeys, defaults, store: storeProp }: UseListPrefsOptions,
): UseListPrefsResult {
  const ui = useUi()
  const store = storeProp ?? ui.listPrefsStore ?? localOnlyListPrefsStore
  const userId = store.userId
  noteUser(userId)
  const key = listPrefsStorageKey(userId, listKey)
  // El almacén se suele crear en el render: se lee por ref para que su
  // identidad no reinicie callbacks ni efectos (manda `userId`).
  const storeRef = useRef(store)
  useEffect(() => {
    storeRef.current = store
  })

  const queryClient = useQueryClient()
  const knownKey = columnKeys.join('|')
  // Los defaults se pasan como literal en el render: se estabilizan por valor.
  const defaultsJson = JSON.stringify(resolveListDefaults(defaults))
  const normalize = useCallback(
    (raw: unknown) =>
      normalizeListPrefs(
        raw,
        knownKey ? knownKey.split('|') : [],
        JSON.parse(defaultsJson) as ListPrefs,
      ),
    [knownKey, defaultsJson],
  )

  const snapshot = useSyncExternalStore(
    useCallback((cb: () => void) => subscribe(key, cb), [key]),
    () => readSnapshot(key),
    () => null,
  )
  const prefs = useMemo(() => normalize(parse(snapshot)), [normalize, snapshot])
  // Valor vigente para los setters, leído del store en el momento de la
  // llamada (evita closures rancias al encadenar cambios).
  const current = useCallback(() => normalize(parse(readSnapshot(key))), [normalize, key])

  const queryKey = useMemo(() => ['list-prefs', userId, listKey] as const, [userId, listKey])
  const query = useQuery({
    queryKey,
    enabled: !!userId,
    // Se reconcilia una vez al montar la lista; un refetch en segundo plano
    // (foco de ventana) podría traer una fila anterior a un debounce en vuelo
    // y pisar lo que el usuario acaba de arrastrar.
    staleTime: Infinity,
    queryFn: async (): Promise<{ prefs: unknown } | null> => {
      const raw = await storeRef.current.load(listKey)
      return raw == null ? null : { prefs: raw }
    },
  })

  // Reconcilio: el servidor gana cuando tiene fila. Una sola vez por
  // (usuario, lista): después el estado local es la fuente y cada cambio se
  // escribe hacia arriba.
  const reconciledRef = useRef<string | null>(null)
  useEffect(() => {
    if (!userId || !query.isSuccess) return
    const tag = `${userId}:${listKey}`
    if (reconciledRef.current === tag) return
    reconciledRef.current = tag
    const local = current()
    if (query.data) {
      const next = normalize(query.data.prefs)
      if (!listPrefsEqual(next, local)) writeLocal(key, next)
    } else if (!listPrefsEqual(local, normalize(null))) {
      void storeRef.current.save(listKey, local)
    }
    dropLegacy(listKey)
  }, [userId, listKey, key, query.isSuccess, query.data, normalize, current])

  // Escritura. `pendingRef` guarda la escritura pendiente de los anchos para
  // ejecutarla si la lista se desmonta antes de que venza el debounce.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<ListPrefs | null>(null)
  const commit = useCallback(
    (next: ListPrefs) => {
      pendingRef.current = null
      if (!userId) return
      queryClient.setQueryData(['list-prefs', userId, listKey], { prefs: next })
      void storeRef.current.save(listKey, next)
    },
    [userId, listKey, queryClient],
  )
  const persist = useCallback(
    (next: ListPrefs, { debounce }: { debounce: boolean }) => {
      writeLocal(key, next)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (!debounce) {
        commit(next)
        return
      }
      pendingRef.current = next
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        if (pendingRef.current) commit(pendingRef.current)
      }, LIST_PREFS_WIDTHS_DEBOUNCE_MS)
    },
    [key, commit],
  )
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (pendingRef.current) commit(pendingRef.current)
    },
    [commit],
  )

  const setHidden = useCallback(
    (hidden: string[]) => persist({ ...current(), hidden }, { debounce: false }),
    [persist, current],
  )
  const setWidths = useCallback(
    (widths: Record<string, number>) => persist({ ...current(), widths }, { debounce: true }),
    [persist, current],
  )
  const setSort = useCallback(
    (sort: ListSort | null) => persist({ ...current(), sort }, { debounce: false }),
    [persist, current],
  )
  const setPageSize = useCallback(
    (pageSize: number) => persist({ ...current(), pageSize }, { debounce: false }),
    [persist, current],
  )
  const setCompact = useCallback(
    (compact: boolean) => persist({ ...current(), compact }, { debounce: false }),
    [persist, current],
  )
  const setOrder = useCallback(
    (order: string[]) => persist({ ...current(), order }, { debounce: false }),
    [persist, current],
  )
  // «Restablecer columnas» vuelve a los DEFAULTS del listado (v0.9.2): las
  // columnas que la lista oculta de serie (`defaults.hidden`) vuelven a
  // ocultarse, no se muestran todas. Anchos y orden de columnas, los de
  // `defaults` (sin ellos, `{}` y `[]`: anchos y orden de serie).
  const reset = useCallback(() => {
    const base = normalize(null)
    persist(
      { ...current(), hidden: base.hidden, widths: base.widths, order: base.order },
      { debounce: false },
    )
  }, [persist, current, normalize])

  return {
    prefs,
    setHidden,
    setWidths,
    setSort,
    setPageSize,
    setCompact,
    setOrder,
    reset,
    isLoaded:
      userId === null ||
      (userId !== undefined && (snapshot != null || query.isSuccess || query.isError)),
  }
}

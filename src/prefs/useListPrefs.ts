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
// `memory` guarda la última cadena conocida por clave: da un snapshot estable
// (misma referencia mientras no cambie) y hace de caché cuando localStorage no
// está disponible (modo privado, webviews): la preferencia sigue viva en la
// sesión aunque no sobreviva a una recarga.
// ---------------------------------------------------------------------------
const memory = new Map<string, string | null>()
const listeners = new Map<string, Set<() => void>>()

function storageKey(listKey: string) {
  return `${LIST_PREFS_STORAGE_PREFIX}${listKey}`
}

function readSnapshot(listKey: string): string | null {
  if (!memory.has(listKey)) memory.set(listKey, safeStorage.getItem(storageKey(listKey)))
  return memory.get(listKey) ?? null
}

function notify(listKey: string) {
  listeners.get(listKey)?.forEach((cb) => cb())
}

function writeLocal(listKey: string, prefs: ListPrefs) {
  const raw = JSON.stringify(prefs)
  if (memory.get(listKey) === raw) return
  memory.set(listKey, raw)
  safeStorage.setItem(storageKey(listKey), raw)
  notify(listKey)
}

function subscribe(listKey: string, cb: () => void) {
  let set = listeners.get(listKey)
  if (!set) {
    set = new Set()
    listeners.set(listKey, set)
  }
  set.add(cb)
  // Otra pestaña cambió la misma lista: se refleja aquí también.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== storageKey(listKey)) return
    memory.set(listKey, e.newValue)
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
  /** «Restablecer columnas»: ocultas y anchos fuera; orden y tamaño de página se conservan. */
  reset: () => void
  /** Ya se reconcilió con el servidor (o no hay nada remoto que esperar). */
  isLoaded: boolean
}

/**
 * Preferencias de un listado configurable (orden, anchos, columnas ocultas,
 * filas por página), por usuario y sincronizadas entre dispositivos.
 *
 * - Lectura: `list-prefs:<listKey>` de localStorage (vía `safeStorage`), sin
 *   salto en el primer render de una SPA y sin error de hidratación en Next.
 *   Cuando llega la fila del almacén remoto, GANA (una vez por usuario y
 *   lista). Si el almacén no tiene fila y la caché local trae algo distinto del
 *   defecto, se sube la local para que el siguiente dispositivo la encuentre.
 * - Escritura: orden, ocultas y tamaño de página al instante; anchos con
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
    useCallback((cb: () => void) => subscribe(listKey, cb), [listKey]),
    () => readSnapshot(listKey),
    () => null,
  )
  const prefs = useMemo(() => normalize(parse(snapshot)), [normalize, snapshot])
  // Valor vigente para los setters, leído del store en el momento de la
  // llamada (evita closures rancias al encadenar cambios).
  const current = useCallback(() => normalize(parse(readSnapshot(listKey))), [normalize, listKey])

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
      if (!listPrefsEqual(next, local)) writeLocal(listKey, next)
    } else if (!listPrefsEqual(local, normalize(null))) {
      void storeRef.current.save(listKey, local)
    }
  }, [userId, listKey, query.isSuccess, query.data, normalize, current])

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
      writeLocal(listKey, next)
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
    [listKey, commit],
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
  const reset = useCallback(
    () => persist({ ...current(), hidden: [], widths: {} }, { debounce: false }),
    [persist, current],
  )

  return {
    prefs,
    setHidden,
    setWidths,
    setSort,
    setPageSize,
    reset,
    isLoaded: !userId || query.isSuccess || query.isError,
  }
}

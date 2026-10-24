/** Dirección de orden de una columna. */
export type SortDir = 'asc' | 'desc'
/** Orden servidor de un listado: columna + dirección. */
export type ListSort = { key: string; dir: SortDir }

// Preferencias de un listado configurable (ResponsiveList con orden, anchos y
// columnas visibles), tal como viajan a `user_list_prefs.prefs` y a la caché
// local. Forma única para todas las listas; cada una decide sus claves.
export type ListPrefs = {
  hidden: string[]
  widths: Record<string, number>
  sort: ListSort | null
  // Filas por página del listado (selector del ListFooter). Siempre uno de
  // LIST_PAGE_SIZES: cualquier otro valor guardado vuelve al defecto.
  pageSize: number
  // Modo compacto (opt-in por listado, ver `useListView({ compactable })`):
  // cada fila en una línea, con elipsis. Cualquier valor no booleano guardado
  // vuelve al defecto (`false`).
  compact: boolean
  // Orden de las columnas elegido por el usuario (claves). `[]` = orden de
  // serie (el de `columns`). Ver `normalizeListPrefs` y `orderColumns`.
  order: string[]
  // Marca de los anchos (v0.9.10, UI-RESIZE-2): `2` = guardados con el
  // modelo proporcional (0.9.10 en adelante; `useListPrefs.setWidths` la pone
  // al escribir). Sin ella, unos `widths` no vacíos vienen de antes (ancho
  // fijo con scroll, o tope del relleno) y `ResponsiveList` los lee con techo
  // (`hasLegacyWidths`, `listProps.columnWidthsLegacy`). Opcional: unas prefs
  // escritas a mano sin ella siguen siendo válidas.
  widthsV?: typeof LIST_WIDTHS_VERSION
}

/** Valor actual de `ListPrefs.widthsV` (v0.9.10). */
export const LIST_WIDTHS_VERSION = 2 as const

/**
 * ¿Los anchos de estas prefs son de antes de la marca (v0.9.10, UI-RESIZE-2)?
 * Sí si hay anchos guardados y no llevan `widthsV: 2`.
 */
export function hasLegacyWidths(prefs: Pick<ListPrefs, 'widths' | 'widthsV'>): boolean {
  return prefs.widthsV !== LIST_WIDTHS_VERSION && Object.keys(prefs.widths).length > 0
}

// Tamaños de página que ofrece el selector. Si se cambia esta lista, las
// preferencias guardadas con un tamaño retirado caen al defecto de la lista.
export const LIST_PAGE_SIZES = [10, 25, 50, 100] as const
export type ListPageSize = (typeof LIST_PAGE_SIZES)[number]
export const DEFAULT_LIST_PAGE_SIZE: ListPageSize = 25

export function isListPageSize(value: unknown): value is ListPageSize {
  return (LIST_PAGE_SIZES as readonly unknown[]).includes(value)
}

export const LIST_PREFS_STORAGE_PREFIX = 'list-prefs:'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Sanea unas preferencias leídas de fuera (localStorage o BD) contra las
 * columnas que la lista conoce HOY. Es un reducer puro: nunca lanza.
 *
 * - Columnas ocultas: solo claves conocidas, sin repetidos.
 * - Anchos: solo claves conocidas con un número finito y positivo (redondeado).
 * - Orden: solo si la clave es conocida y `dir` es asc/desc; si no, el orden
 *   por defecto de la lista (nunca «sin orden»).
 * - Tamaño de página: solo uno de LIST_PAGE_SIZES; si no, el de `defaults`
 *   (y si ese tampoco vale, DEFAULT_LIST_PAGE_SIZE). No es una clave de
 *   columna: `knownKeys` no le afecta.
 * - Compacto: solo un booleano; si no, el de `defaults` (y si ese tampoco lo
 *   es, `false`).
 * - Marca de anchos (`widthsV`, v0.9.10): solo con anchos no vacíos. `2` si
 *   `raw` la trae (o los anchos son los de `defaults`); unos `widths` de
 *   `raw` sin ella son viejos y la marca se omite (ver `hasLegacyWidths`).
 * - Orden de columnas: solo claves conocidas, sin repetidas, y las columnas
 *   conocidas que falten se AÑADEN AL FINAL (una columna nueva aparece detrás
 *   de las que el usuario ya colocó). Si no es un array, el de `defaults`; un
 *   array sin ninguna clave conocida queda en `[]` (orden de serie).
 *
 * Una columna renombrada o eliminada deja de aparecer sin romper nada, y un
 * `prefs` corrupto vuelve a los valores por defecto.
 */
export function normalizeListPrefs(
  raw: unknown,
  knownKeys: string[],
  defaults: ListPrefs,
): ListPrefs {
  const known = new Set(knownKeys)
  const base: ListPrefs = {
    hidden: defaults.hidden.filter((k) => known.has(k)),
    widths: cleanWidths(defaults.widths, known),
    sort: cleanSort(defaults.sort, known),
    pageSize: isListPageSize(defaults.pageSize) ? defaults.pageSize : DEFAULT_LIST_PAGE_SIZE,
    compact: typeof defaults.compact === 'boolean' ? defaults.compact : false,
    order: cleanOrder(defaults.order, knownKeys),
  }
  // Los anchos de `defaults` los pone la página: no son viejos.
  if (Object.keys(base.widths).length > 0) base.widthsV = LIST_WIDTHS_VERSION
  if (!isRecord(raw)) return base

  const hidden = Array.isArray(raw.hidden)
    ? Array.from(
        new Set(raw.hidden.filter((k): k is string => typeof k === 'string' && known.has(k))),
      )
    : base.hidden

  const widths = isRecord(raw.widths) ? cleanWidths(raw.widths, known) : base.widths

  const sort = 'sort' in raw ? (cleanSort(raw.sort, known) ?? base.sort) : base.sort

  const pageSize = isListPageSize(raw.pageSize) ? raw.pageSize : base.pageSize

  const compact = typeof raw.compact === 'boolean' ? raw.compact : base.compact

  const order = Array.isArray(raw.order) ? cleanOrder(raw.order, knownKeys) : base.order

  // Marca: solo con anchos. Viejos = leídos de `raw`, no vacíos y sin marca.
  const legacy = isRecord(raw.widths) && raw.widthsV !== LIST_WIDTHS_VERSION
  const marked = Object.keys(widths).length > 0 && !legacy
  return {
    hidden,
    widths,
    sort,
    pageSize,
    compact,
    order,
    ...(marked ? { widthsV: LIST_WIDTHS_VERSION } : {}),
  }
}

function cleanOrder(raw: unknown, knownKeys: string[]): string[] {
  if (!Array.isArray(raw)) return []
  const known = new Set(knownKeys)
  const kept = Array.from(
    new Set(raw.filter((k): k is string => typeof k === 'string' && known.has(k))),
  )
  if (kept.length === 0) return []
  const seen = new Set(kept)
  return [...kept, ...knownKeys.filter((k) => !seen.has(k))]
}

function cleanWidths(raw: Record<string, unknown>, known: Set<string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!known.has(key)) continue
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue
    out[key] = Math.round(value)
  }
  return out
}

function cleanSort(raw: unknown, known: Set<string>): ListSort | null {
  if (!isRecord(raw)) return null
  const { key, dir } = raw
  if (typeof key !== 'string' || !known.has(key)) return null
  if (dir !== 'asc' && dir !== 'desc') return null
  return { key, dir }
}

/** Igualdad estructural, para no escribir en BD lo que ya está. */
export function listPrefsEqual(a: ListPrefs, b: ListPrefs): boolean {
  if (a.hidden.length !== b.hidden.length || a.hidden.some((k, i) => k !== b.hidden[i])) {
    return false
  }
  const aw = Object.entries(a.widths)
  const bw = Object.entries(b.widths)
  if (aw.length !== bw.length || aw.some(([k, v]) => b.widths[k] !== v)) return false
  if (a.pageSize !== b.pageSize) return false
  if (a.widthsV !== b.widthsV) return false
  if (a.compact !== b.compact) return false
  if (a.order.length !== b.order.length || a.order.some((k, i) => k !== b.order[i])) return false
  if (a.sort === null || b.sort === null) return a.sort === b.sort
  return a.sort.key === b.sort.key && a.sort.dir === b.sort.dir
}

/**
 * Valores por defecto de un listado tal como los escribe una página: todo es
 * opcional (sin orden, sin ocultas, sin anchos, 25 por página, sin compacto,
 * columnas en su orden de serie).
 */
export type ListPrefsDefaults = {
  sort?: ListSort | null
  hidden?: string[]
  widths?: Record<string, number>
  pageSize?: number
  compact?: boolean
  order?: string[]
}

/** Rellena los opcionales de unos defaults para obtener unas `ListPrefs`. */
export function resolveListDefaults(defaults: ListPrefsDefaults = {}): ListPrefs {
  return {
    hidden: defaults.hidden ?? [],
    widths: defaults.widths ?? {},
    sort: defaults.sort ?? null,
    pageSize: defaults.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
    compact: defaults.compact ?? false,
    order: defaults.order ?? [],
  }
}

/**
 * Preferencias vacías: sin ocultas, sin anchos, sin orden, 25 por página, sin
 * compacto, columnas en su orden de serie.
 */
export const EMPTY_LIST_PREFS: ListPrefs = Object.freeze({
  hidden: [],
  widths: {},
  sort: null,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
  compact: false,
  order: [],
}) as ListPrefs

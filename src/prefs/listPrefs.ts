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
}

// Tamaños de página que ofrece el selector. Si se cambia esta lista, las
// preferencias guardadas con un tamaño retirado caen al defecto de la lista.
export const LIST_PAGE_SIZES = [10, 25, 50] as const
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
  }
  if (!isRecord(raw)) return base

  const hidden = Array.isArray(raw.hidden)
    ? Array.from(
        new Set(raw.hidden.filter((k): k is string => typeof k === 'string' && known.has(k))),
      )
    : base.hidden

  const widths = isRecord(raw.widths) ? cleanWidths(raw.widths, known) : base.widths

  const sort = 'sort' in raw ? (cleanSort(raw.sort, known) ?? base.sort) : base.sort

  const pageSize = isListPageSize(raw.pageSize) ? raw.pageSize : base.pageSize

  return { hidden, widths, sort, pageSize }
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
  if (a.sort === null || b.sort === null) return a.sort === b.sort
  return a.sort.key === b.sort.key && a.sort.dir === b.sort.dir
}

/**
 * Valores por defecto de un listado tal como los escribe una página: todo es
 * opcional (sin orden, sin ocultas, sin anchos, 25 por página).
 */
export type ListPrefsDefaults = {
  sort?: ListSort | null
  hidden?: string[]
  widths?: Record<string, number>
  pageSize?: number
}

/** Rellena los opcionales de unos defaults para obtener unas `ListPrefs`. */
export function resolveListDefaults(defaults: ListPrefsDefaults = {}): ListPrefs {
  return {
    hidden: defaults.hidden ?? [],
    widths: defaults.widths ?? {},
    sort: defaults.sort ?? null,
    pageSize: defaults.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
  }
}

/** Preferencias vacías: sin ocultas, sin anchos, sin orden, 25 por página. */
export const EMPTY_LIST_PREFS: ListPrefs = Object.freeze({
  hidden: [],
  widths: {},
  sort: null,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
}) as ListPrefs

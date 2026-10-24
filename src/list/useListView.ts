import { useMemo } from 'react'

import { useListPrefs } from '../prefs/useListPrefs'
import {
  hasLegacyWidths,
  resolveListDefaults,
  type ListPrefs,
  type ListPrefsDefaults,
  type ListSort,
} from '../prefs/listPrefs'
import type { ListPrefsStore } from '../prefs/stores'
import { usePagination } from './usePagination'

// Valores por defecto de un listado. `sort` es el orden inicial (la lista
// siempre viene ordenada del servidor; `null` únicamente si NINGUNA columna
// ordena). El resto se rellena: sin ocultas, sin anchos, 25 por página.
export type ListViewDefaults = ListPrefsDefaults

export type UseListViewOptions = {
  // Claves de columna que la lista conoce HOY (las `key` de sus columnas).
  // Todo lo guardado para otra clave se descarta (normalizeListPrefs).
  columnKeys: readonly string[]
  defaults: ListViewDefaults
  // Filtros/búsqueda que devuelven la lista a la página 1 al cambiar. El orden
  // y el tamaño de página ya se incluyen solos.
  deps?: unknown[]
  // Paginación servidor (por defecto, sí). Con `false` el hook no devuelve
  // página, rango ni `footerProps`: para listas que se pintan enteras.
  paginated?: boolean
  // Cabecera fija de la tabla (por defecto, sí). Ver `ResponsiveList.stickyHeader`.
  stickyHeader?: boolean
  // Almacén de preferencias (por defecto el del `UiProvider`, o solo local).
  store?: ListPrefsStore
  // Ofrece «Modo compacto» en el menú de columnas (por defecto, no). Solo con
  // esta opción `listProps`/`footerProps` llevan `compact` + `onCompactChange`;
  // sin ella `compact` es siempre `false`, aunque haya uno guardado.
  compactable?: boolean
}

// Props que `useListView` cablea en `ResponsiveList` (se hace spread tal cual).
// Incluye los dos callbacks del menú de columnas: la tabla lo pinta ella misma
// en la cabecera (escritorio), así que ninguna página tiene que pasarlo.
export type ListViewListProps = {
  sort: ListSort | null
  onSortChange: (next: ListSort) => void
  resizable: true
  columnWidths: Record<string, number>
  // v0.9.10 (UI-RESIZE-2): los anchos son de antes de 0.9.9 (sin marca):
  // `ResponsiveList` los lee con techo. Si se pasan los anchos a mano, pásalo
  // también (o los anchos viejos se leen sin techo).
  columnWidthsLegacy?: boolean
  onColumnWidthsChange: (widths: Record<string, number>) => void
  hiddenColumns: string[]
  onHiddenColumnsChange: (hidden: string[]) => void
  onColumnsReset: () => void
  // Menú de columnas encima de las tarjetas en móvil. `false` en modo paginado
  // (el `ListFooter` ya lo pinta en móvil: saldría dos veces) y `true` con
  // `paginated: false` (no hay pie). Si usas el modo paginado SIN `ListFooter`,
  // sobrescríbelo tras el spread: `{...view.listProps} mobileColumnsMenu`.
  mobileColumnsMenu: boolean
  stickyHeader: boolean
  // Solo con `compactable: true`.
  compact?: boolean
  onCompactChange?: (compact: boolean) => void
  // Orden de columnas del usuario (arrastre de cabeceras + «Subir»/«Bajar»).
  columnOrder: string[]
  onColumnOrderChange: (order: string[]) => void
  // Solo en modo paginado (v0.7.0): submenú «Filas por página» del menú de
  // columnas de la cabecera. Cambiarlo vuelve a la página 1.
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  // v0.8.0: `false` mientras las preferencias no son las definitivas (ver
  // `ListView.ready`): `ResponsiveList` pinta un esqueleto en vez de la tabla
  // con anchos/orden/columnas por defecto que luego saltarían.
  ready: boolean
}

// Props que `useListView` cablea en `ListFooter` (faltan `total`, que sale de
// la consulta, y `columns`:
// `<ListFooter {...footerProps} columns={columns} total={total} />`).
export type ListViewFooterProps = {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  hidden: string[]
  onHiddenChange: (hidden: string[]) => void
  onReset: () => void
  // Solo con `compactable: true` (casilla del menú de columnas del pie).
  compact?: boolean
  onCompactChange?: (compact: boolean) => void
  // Orden de columnas («Subir»/«Bajar» del menú de columnas del pie).
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
}

type ListViewBase = {
  prefs: ListPrefs
  sort: ListSort | null
  listProps: ListViewListProps
  /**
   * v0.8.0: las preferencias (orden, columnas, anchos, compacto, filas por
   * página) ya son las definitivas: caché local de ESTE usuario, respuesta del
   * servidor o sin sesión. Mientras es `false`, `sort`/`from`/`to` son los
   * por defecto y NO deben usarse para consultar: pasa `enabled: view.ready`
   * a la consulta del listado (así no se pide una página con el orden o el
   * tamaño equivocados que luego cambia).
   */
  ready: boolean
  /** Alias de `ready` (nombre anterior a v0.8.0). */
  isLoaded: boolean
  /** Modo compacto vigente (`false` si el listado no es `compactable`). */
  compact: boolean
  /** Orden de columnas guardado (`[]` = el de serie). Ver `orderColumns`. */
  order: string[]
}

export type ListView = ListViewBase & {
  pageSize: number
  page: number
  setPage: (page: number) => void
  /** Índice inicial (0-based, inclusive) para `.range(from, to)`. */
  from: number
  /** Índice final (0-based, inclusive) para `.range(from, to)`. */
  to: number
  footerProps: ListViewFooterProps
}

export type UnpaginatedListView = ListViewBase

export { resolveListDefaults }

/**
 * Estado completo de un listado estándar: preferencias por usuario (orden,
 * anchos, columnas ocultas, orden de columnas, tamaño de página y, con `compactable`, modo
 * compacto — `useListPrefs`) + paginación
 * (`usePagination`) ya cableadas entre sí. Devuelve dos paquetes de props
 * listos para hacer spread: `listProps` → `ResponsiveList` (incluido el menú
 * de columnas de la cabecera) y `footerProps` → `ListFooter`; y lo que la
 * consulta necesita: `sort`, `from`, `to` y `ready` (`enabled: view.ready`).
 *
 * Cambiar el orden, el tamaño de página o cualquiera de las `deps` vuelve a la
 * página 1. `listKey` es la clave de `user_list_prefs` (kebab-case, única por
 * listado).
 */
// Orden de las sobrecargas: la paginada va la ÚLTIMA para que
// `ReturnType<typeof useListView>` sea `ListView`.
export function useListView(
  listKey: string,
  options: UseListViewOptions & { paginated: false },
): UnpaginatedListView
export function useListView(
  listKey: string,
  options: UseListViewOptions & { paginated?: true },
): ListView
export function useListView(
  listKey: string,
  {
    columnKeys,
    defaults,
    deps = [],
    paginated = true,
    stickyHeader = true,
    store,
    compactable = false,
  }: UseListViewOptions,
): ListView | UnpaginatedListView {
  const listPrefs = useListPrefs(listKey, { columnKeys, defaults, store })
  const { prefs, setSort, setWidths, setHidden, setPageSize, setCompact, setOrder, reset } =
    listPrefs
  const { sort, hidden, widths, pageSize, order } = prefs
  const compact = compactable && prefs.compact
  const widthsLegacy = hasLegacyWidths(prefs)
  const ready = listPrefs.isLoaded

  // Siempre se llama (reglas de los hooks); sin paginación simplemente no se usa.
  const { page, setPage, from, to } = usePagination([...deps, sort], pageSize)

  const listProps = useMemo<ListViewListProps>(
    () => ({
      sort,
      onSortChange: setSort,
      resizable: true,
      columnWidths: widths,
      columnWidthsLegacy: widthsLegacy,
      onColumnWidthsChange: setWidths,
      hiddenColumns: hidden,
      onHiddenColumnsChange: setHidden,
      onColumnsReset: reset,
      mobileColumnsMenu: !paginated,
      stickyHeader,
      columnOrder: order,
      onColumnOrderChange: setOrder,
      ...(compactable ? { compact, onCompactChange: setCompact } : {}),
      ...(paginated ? { pageSize, onPageSizeChange: setPageSize } : {}),
      ready,
    }),
    [
      ready,
      order,
      setOrder,
      pageSize,
      setPageSize,
      sort,
      setSort,
      widths,
      widthsLegacy,
      setWidths,
      hidden,
      setHidden,
      reset,
      paginated,
      stickyHeader,
      compactable,
      compact,
      setCompact,
    ],
  )

  const footerProps = useMemo<ListViewFooterProps>(
    () => ({
      page,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
      hidden,
      onHiddenChange: setHidden,
      onReset: reset,
      columnOrder: order,
      onColumnOrderChange: setOrder,
      ...(compactable ? { compact, onCompactChange: setCompact } : {}),
    }),
    [
      page,
      pageSize,
      setPage,
      setPageSize,
      hidden,
      setHidden,
      reset,
      order,
      setOrder,
      compactable,
      compact,
      setCompact,
    ],
  )

  const base: ListViewBase = {
    prefs,
    sort,
    listProps,
    ready,
    isLoaded: ready,
    compact,
    order,
  }
  if (!paginated) return base
  return { ...base, pageSize, page, setPage, from, to, footerProps }
}

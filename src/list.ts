// Entrada "@nscabezon/ui/list": listados (tabla/cards, columnas, paginación,
// preferencias por usuario).
export {
  ResponsiveList,
  TOUCH_TEXT_LINK,
  type ResponsiveColumn,
  type ResponsiveListProps,
} from './list/responsive-list'
export { ColumnsMenu, type ColumnsMenuColumn, type ColumnsMenuProps } from './list/columns-menu'
export { MIN_COLUMN_WIDTH, useColumnResize } from './list/useColumnResize'
export {
  DEFAULT_ACTION_COLUMN_WIDTH,
  resolveColumnWidth,
  visibleColumnsOf,
} from './list/columnWidth'
export { TINTED_ROW_CLASS, rowTone } from './list/rowTone'
export { Pagination, type PaginationProps } from './list/pagination'
export { DEFAULT_PAGE_SIZE, usePagination } from './list/usePagination'
export { ListFooter, type ListFooterProps } from './list/ListFooter'
export {
  resolveListDefaults,
  useListView,
  type ListView,
  type ListViewDefaults,
  type ListViewFooterProps,
  type ListViewListProps,
  type UnpaginatedListView,
  type UseListViewOptions,
} from './list/useListView'
export { useListColumns } from './list/useListColumns'
export {
  LIST_PREFS_WIDTHS_DEBOUNCE_MS,
  useListPrefs,
  type UseListPrefsOptions,
  type UseListPrefsResult,
} from './prefs/useListPrefs'
export {
  createSupabaseListPrefsStore,
  localOnlyListPrefsStore,
  type ListPrefsStore,
  type SupabaseLikeClient,
  type SupabaseListPrefsStoreOptions,
} from './prefs/stores'
export {
  useSupabaseListPrefsStore,
  type SupabaseLikeAuthClient,
} from './prefs/useSupabaseListPrefsStore'
export {
  DEFAULT_LIST_PAGE_SIZE,
  EMPTY_LIST_PREFS,
  LIST_PAGE_SIZES,
  LIST_PREFS_STORAGE_PREFIX,
  isListPageSize,
  listPrefsEqual,
  normalizeListPrefs,
  type ListPageSize,
  type ListPrefs,
  type ListPrefsDefaults,
  type ListSort,
  type SortDir,
} from './prefs/listPrefs'

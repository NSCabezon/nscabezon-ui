// Entrada "@nscabezon/ui/storage": solo funciones y tipos puros, sin React ni
// "use client". Importable desde Server Components, route handlers o scripts.
export { safeStorage } from './lib/safeStorage'
export { cn } from './lib/cn'
export {
  DEFAULT_LIST_PAGE_SIZE,
  EMPTY_LIST_PREFS,
  LIST_PAGE_SIZES,
  LIST_PREFS_STORAGE_PREFIX,
  isListPageSize,
  listPrefsEqual,
  normalizeListPrefs,
  resolveListDefaults,
  type ListPageSize,
  type ListPrefs,
  type ListPrefsDefaults,
  type ListSort,
  type SortDir,
} from './prefs/listPrefs'
export {
  DEFAULT_ACTION_COLUMN_WIDTH,
  resolveColumnWidth,
  visibleColumnsOf,
} from './list/columnWidth'
export { TINTED_ROW_CLASS, rowTone } from './list/rowTone'

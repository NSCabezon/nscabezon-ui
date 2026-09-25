import { useState } from 'react'
import { DEFAULT_LIST_PAGE_SIZE } from '../prefs/listPrefs'

export const DEFAULT_PAGE_SIZE: number = DEFAULT_LIST_PAGE_SIZE

// Page state for server-side pagination (Supabase `.range(from, to)`).
// Pass the filters/search that should reset the list to page 1 as `deps`.
// `pageSize` comes from outside (the user's list prefs via `useListView`, or
// the default) and is part of the reset key: changing it also goes back to
// page 1, because page N of a different size is a different slice.
export function usePagination(deps: unknown[] = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)

  // Any filter/search change collapses back to the first page. Resetting state
  // during render (vs. in an effect) is React's recommended pattern and avoids
  // a wasted render with stale data — see react.dev "You Might Not Need an Effect".
  const key = JSON.stringify([deps, pageSize])
  const [prevKey, setPrevKey] = useState(key)
  if (prevKey !== key) {
    setPrevKey(key)
    setPage(1)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, setPage, pageSize, from, to }
}

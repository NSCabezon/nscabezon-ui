import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UiProvider } from '../context/UiProvider'
import { makeQueryClient, withQueryClient } from '../test/utils'
import type { ListPrefs } from './listPrefs'
import type { ListPrefsStore } from './stores'
import { LIST_PREFS_WIDTHS_DEBOUNCE_MS, __resetListPrefsCache, useListPrefs } from './useListPrefs'

const KEYS = ['number', 'client', 'status'] as const
const SORT = { key: 'number', dir: 'desc' } as const
const DEFAULTS = { sort: SORT }
const DEFAULT_PREFS: ListPrefs = { hidden: [], widths: {}, sort: SORT, pageSize: 25 }

function fakeStore(row: unknown | null = null, userId: string | null = 'u1') {
  const save = vi.fn<ListPrefsStore['save']>(async () => {})
  const load = vi.fn<ListPrefsStore['load']>(async () => row)
  const store: ListPrefsStore = { userId, load, save }
  return { store, load, save }
}

function renderPrefs(store?: ListPrefsStore, listKey = 'orders') {
  const client = makeQueryClient()
  return renderHook(
    () => useListPrefs(listKey, { columnKeys: KEYS, defaults: DEFAULTS, store }),
    { wrapper: withQueryClient(client) },
  )
}

beforeEach(() => {
  localStorage.clear()
  __resetListPrefsCache()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useListPrefs', () => {
  it('sin nada guardado devuelve los defaults normalizados', () => {
    const { result } = renderPrefs()
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
    // Solo local: no hay nada remoto que esperar.
    expect(result.current.isLoaded).toBe(true)
  })

  it('lee la caché local `list-prefs:<key>` en el primer render y descarta claves desconocidas', () => {
    localStorage.setItem(
      'list-prefs:orders',
      JSON.stringify({ hidden: ['client', 'ghost'], widths: { status: 90, ghost: 10 }, pageSize: 50 }),
    )
    const { result } = renderPrefs()
    expect(result.current.prefs).toEqual({
      hidden: ['client'],
      widths: { status: 90 },
      sort: SORT,
      pageSize: 50,
    })
  })

  it('hidratación: el render de servidor usa los defaults aunque haya caché local', () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'] }))
    let seen: ListPrefs | undefined
    function Probe() {
      seen = useListPrefs('orders', { columnKeys: KEYS, defaults: DEFAULTS }).prefs
      return <span>{seen.hidden.join(',') || 'ninguna'}</span>
    }
    const html = renderToString(
      <QueryClientProvider client={makeQueryClient()}>
        <Probe />
      </QueryClientProvider>,
    )
    expect(html).toContain('ninguna')
    expect(seen).toEqual(DEFAULT_PREFS)
  })

  it('la fila del servidor gana a la caché local (normalizada) y se escribe en la caché', async () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'] }))
    const { store, save } = fakeStore({ hidden: ['status', 'ghost'], widths: { number: 80 } })
    const { result } = renderPrefs(store)
    expect(result.current.prefs.hidden).toEqual(['client'])
    await waitFor(() => expect(result.current.prefs.hidden).toEqual(['status']))
    expect(result.current.prefs.widths).toEqual({ number: 80 })
    expect(result.current.isLoaded).toBe(true)
    expect(JSON.parse(localStorage.getItem('list-prefs:orders')!).hidden).toEqual(['status'])
    // El servidor ya lo tenía: no se vuelve a subir.
    expect(save).not.toHaveBeenCalled()
  })

  it('sin fila en el servidor sube la caché local si difiere del defecto', async () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'] }))
    const { store, save } = fakeStore(null)
    renderPrefs(store)
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save).toHaveBeenCalledWith('orders', { ...DEFAULT_PREFS, hidden: ['client'] })
  })

  it('sin fila en el servidor y sin caché no escribe nada', async () => {
    const { store, load, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(load).toHaveBeenCalledWith('orders')
    expect(save).not.toHaveBeenCalled()
  })

  it('un error al cargar deja la caché local y marca isLoaded', async () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'] }))
    const store: ListPrefsStore = {
      userId: 'u1',
      load: async () => {
        throw new Error('red')
      },
      save: vi.fn(async () => {}),
    }
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.prefs.hidden).toEqual(['client'])
  })

  it('ocultas, orden y tamaño de página se guardan al instante', async () => {
    const { store, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    act(() => result.current.setHidden(['client']))
    expect(result.current.prefs.hidden).toEqual(['client'])
    expect(save).toHaveBeenLastCalledWith('orders', { ...DEFAULT_PREFS, hidden: ['client'] })

    act(() => result.current.setSort({ key: 'status', dir: 'asc' }))
    act(() => result.current.setPageSize(10))
    expect(result.current.prefs).toEqual({
      hidden: ['client'],
      widths: {},
      sort: { key: 'status', dir: 'asc' },
      pageSize: 10,
    })
    expect(save).toHaveBeenCalledTimes(3)
    expect(JSON.parse(localStorage.getItem('list-prefs:orders')!).pageSize).toBe(10)
  })

  it('los anchos van con debounce de 400 ms (solo el último) y la caché local al instante', async () => {
    const { store, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    vi.useFakeTimers()

    act(() => result.current.setWidths({ number: 100 }))
    act(() => result.current.setWidths({ number: 120 }))
    expect(result.current.prefs.widths).toEqual({ number: 120 })
    expect(JSON.parse(localStorage.getItem('list-prefs:orders')!).widths).toEqual({ number: 120 })
    act(() => vi.advanceTimersByTime(LIST_PREFS_WIDTHS_DEBOUNCE_MS - 1))
    expect(save).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('orders', { ...DEFAULT_PREFS, widths: { number: 120 } })
  })

  it('desmontar con un ancho pendiente lo escribe en el acto (flush)', async () => {
    const { store, save } = fakeStore(null)
    const { result, unmount } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    vi.useFakeTimers()
    act(() => result.current.setWidths({ client: 150 }))
    expect(save).not.toHaveBeenCalled()
    unmount()
    expect(save).toHaveBeenCalledWith('orders', { ...DEFAULT_PREFS, widths: { client: 150 } })
  })

  it('reset limpia ocultas y anchos pero conserva orden y tamaño de página', async () => {
    const { result } = renderPrefs()
    act(() => result.current.setSort({ key: 'client', dir: 'asc' }))
    act(() => result.current.setPageSize(50))
    act(() => result.current.setHidden(['status']))
    act(() => result.current.setWidths({ number: 70 }))
    act(() => result.current.reset())
    expect(result.current.prefs).toEqual({
      hidden: [],
      widths: {},
      sort: { key: 'client', dir: 'asc' },
      pageSize: 50,
    })
  })

  it('dos listas montadas con la misma clave se ven entre sí', () => {
    const client = makeQueryClient()
    const wrapper = withQueryClient(client)
    const a = renderHook(() => useListPrefs('shared', { columnKeys: KEYS }), { wrapper })
    const b = renderHook(() => useListPrefs('shared', { columnKeys: KEYS }), { wrapper })
    act(() => a.result.current.setHidden(['client']))
    expect(b.result.current.prefs.hidden).toEqual(['client'])
  })

  it('sin `store` usa el `listPrefsStore` del UiProvider', async () => {
    const { store, load } = fakeStore({ hidden: ['status'] })
    const client = makeQueryClient()
    const { result } = renderHook(() => useListPrefs('orders', { columnKeys: KEYS }), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>
          <UiProvider listPrefsStore={store}>{children}</UiProvider>
        </QueryClientProvider>
      ),
    })
    await waitFor(() => expect(result.current.prefs.hidden).toEqual(['status']))
    expect(load).toHaveBeenCalledWith('orders')
  })

  it('sin usuario no llama al almacén', async () => {
    const { store, load, save } = fakeStore({ hidden: ['status'] }, null)
    const { result } = renderPrefs(store)
    act(() => result.current.setHidden(['client']))
    expect(result.current.isLoaded).toBe(true)
    expect(load).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })
})

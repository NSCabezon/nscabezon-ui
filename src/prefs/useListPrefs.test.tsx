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
const DEFAULT_PREFS: ListPrefs = { hidden: [], widths: {}, sort: SORT, pageSize: 25, compact: false, order: [] }

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
      compact: false,
      order: [],
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
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['client'] }))
    const { store, save } = fakeStore({ hidden: ['status', 'ghost'], widths: { number: 80 } })
    const { result } = renderPrefs(store)
    expect(result.current.prefs.hidden).toEqual(['client'])
    await waitFor(() => expect(result.current.prefs.hidden).toEqual(['status']))
    expect(result.current.prefs.widths).toEqual({ number: 80 })
    expect(result.current.isLoaded).toBe(true)
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).hidden).toEqual(['status'])
    // El servidor ya lo tenía: no se vuelve a subir.
    expect(save).not.toHaveBeenCalled()
  })

  it('sin fila en el servidor sube la caché local si difiere del defecto', async () => {
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['client'] }))
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
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['client'] }))
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
      compact: false,
      order: [],
    })
    expect(save).toHaveBeenCalledTimes(3)
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).pageSize).toBe(10)
  })

  it('los anchos van con debounce de 400 ms (solo el último) y la caché local al instante', async () => {
    const { store, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    vi.useFakeTimers()

    act(() => result.current.setWidths({ number: 100 }))
    act(() => result.current.setWidths({ number: 120 }))
    expect(result.current.prefs.widths).toEqual({ number: 120 })
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).widths).toEqual({ number: 120 })
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

  it('reset limpia ocultas, anchos y orden de columnas pero conserva orden de filas, tamaño de página y compacto', async () => {
    const { result } = renderPrefs()
    act(() => result.current.setOrder(['status', 'number', 'client']))
    expect(result.current.prefs.order).toEqual(['status', 'number', 'client'])
    act(() => result.current.setSort({ key: 'client', dir: 'asc' }))
    act(() => result.current.setPageSize(50))
    act(() => result.current.setCompact(true))
    act(() => result.current.setHidden(['status']))
    act(() => result.current.setWidths({ number: 70 }))
    act(() => result.current.reset())
    expect(result.current.prefs).toEqual({
      hidden: [],
      widths: {},
      sort: { key: 'client', dir: 'asc' },
      pageSize: 50,
      compact: true,
      order: [],
    })
  })

  it('setCompact se guarda al instante (local y remoto, sin debounce)', async () => {
    const { store, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    act(() => result.current.setCompact(true))
    expect(result.current.prefs.compact).toBe(true)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenLastCalledWith('orders', { ...DEFAULT_PREFS, compact: true })
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).compact).toBe(true)
    act(() => result.current.setCompact(false))
    expect(result.current.prefs.compact).toBe(false)
    expect(save).toHaveBeenLastCalledWith('orders', DEFAULT_PREFS)
  })

  it('setOrder se guarda al instante (local y remoto, sin debounce) y normalizado', async () => {
    const { store, save } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    act(() => result.current.setOrder(['status', 'number', 'client']))
    expect(result.current.prefs.order).toEqual(['status', 'number', 'client'])
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenLastCalledWith('orders', {
      ...DEFAULT_PREFS,
      order: ['status', 'number', 'client'],
    })
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).order).toEqual([
      'status',
      'number',
      'client',
    ])
    // Lo que se lee pasa por normalizeListPrefs: faltantes al final.
    act(() => result.current.setOrder(['client']))
    expect(result.current.prefs.order).toEqual(['client', 'number', 'status'])
  })

  it('la fila del servidor trae el orden de columnas guardado', async () => {
    const { store } = fakeStore({ order: ['client', 'status', 'number'] })
    const { result } = renderPrefs(store)
    await waitFor(() =>
      expect(result.current.prefs.order).toEqual(['client', 'status', 'number']),
    )
  })

  it('la fila del servidor trae el compacto guardado', async () => {
    const { store } = fakeStore({ compact: true })
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.prefs.compact).toBe(true))
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

// v0.8.0: los listados «bailaban» porque las prefs del servidor llegaban
// después del primer pintado y la caché local no era por usuario.
describe('useListPrefs (v0.8.0: clave por usuario e isLoaded)', () => {
  // Almacén cuyo `load` no responde hasta que el test lo dice.
  function pendingStore(...args: [userId?: string | null | undefined]) {
    // Sin argumento, 'u1'; `pendingStore(undefined)` = usuario desconocido.
    const userId = args.length ? args[0] : 'u1'
    let resolve!: (row: unknown | null) => void
    const load = vi.fn<ListPrefsStore['load']>(
      () => new Promise((r) => {
        resolve = r
      }),
    )
    const save = vi.fn<ListPrefsStore['save']>(async () => {})
    const store: ListPrefsStore = { userId, load, save }
    return { store, load, save, respond: (row: unknown | null) => act(async () => resolve(row)) }
  }

  it('escribe y lee la caché en `list-prefs:<userId>:<listKey>`, no en la clave sin usuario', async () => {
    const { store } = fakeStore(null)
    const { result } = renderPrefs(store)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    act(() => result.current.setHidden(['client']))
    expect(JSON.parse(localStorage.getItem('list-prefs:u1:orders')!).hidden).toEqual(['client'])
    expect(localStorage.getItem('list-prefs:orders')).toBeNull()
  })

  it('con caché local de ESTE usuario isLoaded es true en el primer render y pinta con ella', () => {
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['client'] }))
    const { store } = pendingStore()
    const { result } = renderPrefs(store)
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.prefs.hidden).toEqual(['client'])
  })

  it('sin caché local isLoaded es false hasta que responde el servidor', async () => {
    const { store, respond } = pendingStore()
    const { result } = renderPrefs(store)
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
    await respond({ hidden: ['status'] })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.prefs.hidden).toEqual(['status'])
  })

  it('sin fila en el servidor isLoaded pasa a true al responder (defaults)', async () => {
    const { store, respond } = pendingStore()
    const { result } = renderPrefs(store)
    expect(result.current.isLoaded).toBe(false)
    await respond(null)
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
  })

  it('no pinta con la clave vieja sin usuario y la borra cuando el servidor responde (sin subirla)', async () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'], pageSize: 100 }))
    const { store, save, respond } = pendingStore()
    const { result } = renderPrefs(store)
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
    expect(result.current.isLoaded).toBe(false)
    await respond(null)
    await waitFor(() => expect(localStorage.getItem('list-prefs:orders')).toBeNull())
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
    // Podía ser de otro usuario: no se sube a la cuenta de este.
    expect(save).not.toHaveBeenCalled()
  })

  it('con usuario desconocido (undefined) no lee ninguna clave, no carga e isLoaded es false', () => {
    localStorage.setItem('list-prefs:orders', JSON.stringify({ hidden: ['client'] }))
    const { store, load } = pendingStore(undefined)
    const { result } = renderPrefs(store)
    expect(result.current.prefs).toEqual(DEFAULT_PREFS)
    expect(result.current.isLoaded).toBe(false)
    expect(load).not.toHaveBeenCalled()
  })

  it('cada usuario pinta con lo suyo y cambiar de usuario vacía la caché en memoria', async () => {
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['client'] }))
    localStorage.setItem('list-prefs:u2:orders', JSON.stringify({ hidden: ['status'] }))
    const s1 = pendingStore('u1').store
    const s2 = pendingStore('u2').store
    const client = makeQueryClient()
    const { result, rerender } = renderHook(
      ({ store }: { store: ListPrefsStore }) =>
        useListPrefs('orders', { columnKeys: KEYS, defaults: DEFAULTS, store }),
      { wrapper: withQueryClient(client), initialProps: { store: s1 } },
    )
    expect(result.current.prefs.hidden).toEqual(['client'])
    // Otro proceso cambia la caché de u1 a espaldas de la memoria.
    localStorage.setItem('list-prefs:u1:orders', JSON.stringify({ hidden: ['number'] }))
    rerender({ store: s2 })
    expect(result.current.prefs.hidden).toEqual(['status'])
    rerender({ store: s1 })
    // La memoria se vació al cambiar de usuario: se relee localStorage.
    expect(result.current.prefs.hidden).toEqual(['number'])
  })
})

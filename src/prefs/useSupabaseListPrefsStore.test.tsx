// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ListPrefsStore } from './stores'
import { useSupabaseListPrefsStore, type SupabaseLikeAuthClient } from './useSupabaseListPrefsStore'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Session = { user: { id: string } } | null
type Listener = (event: string, session: Session) => void

// Cliente falso: `getSession` controlable y `onAuthStateChange` que guarda el listener.
function fakeClient(initial: Session) {
  let resolveSession!: (s: Session) => void
  const listeners = new Set<Listener>()
  const unsubscribe = vi.fn()
  const upsert = vi.fn(async () => ({ error: null }))
  const client = {
    from: vi.fn(() => ({ upsert })),
    auth: {
      getSession: vi.fn(
        () =>
          new Promise<{ data: { session: Session } }>((resolve) => {
            resolveSession = (s) => resolve({ data: { session: s } })
          }),
      ),
      onAuthStateChange: vi.fn((cb: Listener) => {
        listeners.add(cb)
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(cb)
                unsubscribe()
              },
            },
          },
        }
      }),
    },
  }
  return {
    client: client satisfies SupabaseLikeAuthClient,
    upsert,
    unsubscribe,
    listeners,
    resolveInitial: async () => {
      await act(async () => {
        resolveSession(initial)
      })
    },
    emit: (event: string, session: Session) => {
      act(() => {
        for (const cb of listeners) cb(event, session)
      })
    },
  }
}

let container: HTMLDivElement
let root: Root
let stores: ListPrefsStore[]

function Harness({ client, onError }: { client: SupabaseLikeAuthClient; onError?: (e: unknown) => void }) {
  const store = useSupabaseListPrefsStore(client, { onError })
  React.useEffect(() => {
    if (stores[stores.length - 1] !== store) stores.push(store)
  })
  return null
}
const latest = () => stores[stores.length - 1]

beforeEach(() => {
  stores = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('useSupabaseListPrefsStore', () => {
  it('empieza sin usuario y toma el de getSession al montar', async () => {
    const f = fakeClient({ user: { id: 'u1' } })
    act(() => root.render(<Harness client={f.client} />))
    expect(latest().userId).toBeNull()
    await f.resolveInitial()
    expect(latest().userId).toBe('u1')
    expect(f.client.auth.getSession).toHaveBeenCalledTimes(1)
  })

  it('sigue a onAuthStateChange (login/logout) y memoiza por usuario', async () => {
    const f = fakeClient(null)
    act(() => root.render(<Harness client={f.client} />))
    await f.resolveInitial()
    expect(latest().userId).toBeNull()
    f.emit('SIGNED_IN', { user: { id: 'u2' } })
    expect(latest().userId).toBe('u2')
    const signedIn = latest()
    // Re-render con el mismo usuario (y onError en línea): mismo almacén.
    act(() => root.render(<Harness client={f.client} onError={() => {}} />))
    f.emit('TOKEN_REFRESHED', { user: { id: 'u2' } })
    expect(latest()).toBe(signedIn)
    f.emit('SIGNED_OUT', null)
    expect(latest().userId).toBeNull()
  })

  it('una getSession que resuelve tarde no pisa lo que ya dijo el listener', async () => {
    const f = fakeClient({ user: { id: 'viejo' } })
    act(() => root.render(<Harness client={f.client} />))
    f.emit('SIGNED_IN', { user: { id: 'nuevo' } })
    await f.resolveInitial()
    expect(latest().userId).toBe('nuevo')
  })

  it('se da de baja al desmontar', async () => {
    const f = fakeClient(null)
    act(() => root.render(<Harness client={f.client} />))
    await f.resolveInitial()
    expect(f.listeners.size).toBe(1)
    act(() => root.render(<></>))
    expect(f.unsubscribe).toHaveBeenCalledTimes(1)
    expect(f.listeners.size).toBe(0)
  })

  it('el almacén escribe con el usuario de la sesión y avisa con el último onError', async () => {
    const f = fakeClient({ user: { id: 'u1' } })
    const first = vi.fn()
    const second = vi.fn()
    act(() => root.render(<Harness client={f.client} onError={first} />))
    await f.resolveInitial()
    act(() => root.render(<Harness client={f.client} onError={second} />))
    f.upsert.mockResolvedValueOnce({ error: 'boom' as never })
    const prefs = { hidden: [], widths: {}, sort: null, pageSize: 25 as const }
    await latest().save('orders', prefs)
    expect(f.client.from).toHaveBeenCalledWith('user_list_prefs')
    expect(f.upsert).toHaveBeenCalledWith({ user_id: 'u1', list_key: 'orders', prefs })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('boom')
  })

  it('acepta un cliente real de supabase-js (solo tipos)', () => {
    // Si los tipos duck-typed dejaran de casar con supabase-js, esto no compila.
    const real = createClient('http://localhost:54321', 'anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const typed: SupabaseLikeAuthClient = real
    expect(typeof typed.auth.getSession).toBe('function')
  })
})

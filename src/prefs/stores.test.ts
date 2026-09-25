import { describe, expect, it, vi } from 'vitest'

import { createSupabaseListPrefsStore, localOnlyListPrefsStore } from './stores'
import type { ListPrefs } from './listPrefs'

const PREFS: ListPrefs = { hidden: ['a'], widths: {}, sort: null, pageSize: 25 }

// Cliente falso con la cadena que usa el almacén: from().select().eq().eq().maybeSingle()
// y from().upsert().
function fakeClient({
  row = null as unknown,
  selectError = null as unknown,
  upsertError = null as unknown,
} = {}) {
  const calls: { table: string; eq: [string, unknown][]; upsert?: unknown; select?: string }[] = []
  const client = {
    from(table: string) {
      const call: (typeof calls)[number] = { table, eq: [] }
      calls.push(call)
      const builder = {
        select(cols: string) {
          call.select = cols
          return builder
        },
        eq(col: string, value: unknown) {
          call.eq.push([col, value])
          return builder
        },
        maybeSingle: async () => ({ data: row, error: selectError }),
        upsert: async (values: unknown) => {
          call.upsert = values
          return { error: upsertError }
        },
      }
      return builder
    },
  }
  return { client, calls }
}

describe('createSupabaseListPrefsStore', () => {
  it('lee `prefs` de user_list_prefs filtrando por usuario y lista', async () => {
    const { client, calls } = fakeClient({ row: { prefs: { hidden: ['x'] } } })
    const store = createSupabaseListPrefsStore(client, 'u1')
    expect(store.userId).toBe('u1')
    await expect(store.load('orders')).resolves.toEqual({ hidden: ['x'] })
    expect(calls[0]).toMatchObject({
      table: 'user_list_prefs',
      select: 'prefs',
      eq: [
        ['user_id', 'u1'],
        ['list_key', 'orders'],
      ],
    })
  })

  it('sin fila devuelve null; con error lanza', async () => {
    await expect(createSupabaseListPrefsStore(fakeClient().client, 'u1').load('x')).resolves.toBeNull()
    const boom = { message: 'rls' }
    await expect(
      createSupabaseListPrefsStore(fakeClient({ selectError: boom }).client, 'u1').load('x'),
    ).rejects.toBe(boom)
  })

  it('hace upsert de (user_id, list_key, prefs) y no lanza si falla', async () => {
    const { client, calls } = fakeClient({ upsertError: { message: 'x' } })
    const onError = vi.fn()
    const store = createSupabaseListPrefsStore(client, 'u1', { table: 'prefs_t', onError })
    await store.save('orders', PREFS)
    expect(calls[0]).toMatchObject({
      table: 'prefs_t',
      upsert: { user_id: 'u1', list_key: 'orders', prefs: PREFS },
    })
    expect(onError).toHaveBeenCalledWith({ message: 'x' })
  })

  it('sin usuario no toca la BD', async () => {
    const { client, calls } = fakeClient({ row: { prefs: {} } })
    const store = createSupabaseListPrefsStore(client, undefined)
    expect(store.userId).toBeNull()
    await expect(store.load('x')).resolves.toBeNull()
    await store.save('x', PREFS)
    expect(calls).toHaveLength(0)
  })
})

describe('localOnlyListPrefsStore', () => {
  it('no tiene usuario ni nada remoto', async () => {
    expect(localOnlyListPrefsStore.userId).toBeNull()
    await expect(localOnlyListPrefsStore.load('x')).resolves.toBeNull()
  })
})

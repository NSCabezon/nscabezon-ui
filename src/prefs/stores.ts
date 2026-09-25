import type { ListPrefs } from './listPrefs'

/**
 * Dónde se sincronizan las preferencias de listado entre dispositivos.
 *
 * - `userId`: usuario con sesión. `null` = no hay nada remoto que leer ni
 *   escribir (solo caché local). Cambiar de usuario vuelve a reconciliar.
 * - `load`: fila guardada para esa lista, SIN normalizar (el hook la sanea
 *   contra las columnas de hoy), o `null` si no hay fila. Si lanza, el hook se
 *   queda con la caché local.
 * - `save`: upsert de la fila. Los errores se tragan (son preferencias de
 *   pantalla; el siguiente cambio lo vuelve a intentar).
 */
export type ListPrefsStore = {
  userId: string | null
  load: (listKey: string) => Promise<unknown | null>
  save: (listKey: string, prefs: ListPrefs) => Promise<void>
}

/** Solo caché local (localStorage): sin usuario, nada remoto. */
export const localOnlyListPrefsStore: ListPrefsStore = Object.freeze({
  userId: null,
  load: async () => null,
  save: async () => {},
})

/**
 * Forma mínima del cliente de Supabase que usa el almacén. Tipada a mano (y no
 * con `SupabaseClient`) para no acoplar el paquete a los tipos generados de
 * cada app ni obligar a instalar `@supabase/supabase-js` a quien no lo use.
 */
export type SupabaseLikeClient = {
  from: (table: string) => any
}

export type SupabaseListPrefsStoreOptions = {
  /** Tabla con columnas (user_id uuid, list_key text, prefs jsonb). Por defecto `user_list_prefs`. */
  table?: string
  /** Se llama cuando falla la escritura. Por defecto, `console.warn` fuera de producción. */
  onError?: (error: unknown) => void
}

/**
 * Almacén sobre la tabla `user_list_prefs(user_id, list_key, prefs jsonb)`,
 * con PK (user_id, list_key) y RLS «cada usuario lo suyo» (mismo esquema en
 * Gesmoto y TusExámenes).
 *
 * Crea uno por usuario y memoízalo: `useMemo(() =>
 * createSupabaseListPrefsStore(supabase, userId), [userId])`.
 */
export function createSupabaseListPrefsStore(
  client: SupabaseLikeClient,
  userId: string | null | undefined,
  { table = 'user_list_prefs', onError = defaultOnError }: SupabaseListPrefsStoreOptions = {},
): ListPrefsStore {
  const uid = userId ?? null
  return {
    userId: uid,
    async load(listKey) {
      if (!uid) return null
      const { data, error } = await client
        .from(table)
        .select('prefs')
        .eq('user_id', uid)
        .eq('list_key', listKey)
        .maybeSingle()
      if (error) throw error
      return (data as { prefs: unknown } | null)?.prefs ?? null
    },
    async save(listKey, prefs) {
      if (!uid) return
      try {
        const { error } = await client
          .from(table)
          .upsert({ user_id: uid, list_key: listKey, prefs })
        if (error) onError(error)
      } catch (error) {
        onError(error)
      }
    },
  }
}

function defaultOnError(error: unknown) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return
  console.warn('user_list_prefs upsert failed', error)
}

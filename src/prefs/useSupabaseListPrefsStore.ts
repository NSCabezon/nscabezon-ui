import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createSupabaseListPrefsStore,
  defaultOnError,
  type ListPrefsStore,
  type SupabaseLikeClient,
  type SupabaseListPrefsStoreOptions,
} from './stores'

type SessionLike = { user: { id: string } } | null

/**
 * Forma mínima del cliente de Supabase que usa `useSupabaseListPrefsStore`:
 * `.from()` (el almacén) y `auth.getSession` / `auth.onAuthStateChange` (el
 * usuario con sesión). Tipada a mano, igual que `SupabaseLikeClient`: el
 * paquete no importa `@supabase/supabase-js` en tiempo de ejecución.
 */
export type SupabaseLikeAuthClient = SupabaseLikeClient & {
  auth: {
    getSession: () => Promise<{ data: { session: SessionLike } }>
    onAuthStateChange: (callback: (event: string, session: SessionLike) => void) => {
      data: { subscription: { unsubscribe: () => void } }
    }
  }
}

/**
 * Almacén de Supabase para el usuario con sesión, listo para
 * `UiProvider.listPrefsStore`:
 *
 *   const store = useSupabaseListPrefsStore(supabase)
 *   <UiProvider listPrefsStore={store} …>
 *
 * Sigue al usuario él solo: lee la sesión al montar (`getSession`, local, sin
 * red) y se suscribe a `onAuthStateChange` (login/logout en esta u otra
 * pestaña). Sin sesión, `userId` es `null` (solo caché local). El almacén se
 * memoiza por cliente + usuario + tabla: pasa un cliente ESTABLE (el
 * singleton del navegador, o memoízalo). `onError` se lee de un ref: puede
 * ser una función en línea.
 */
export function useSupabaseListPrefsStore(
  client: SupabaseLikeAuthClient,
  { table, onError }: SupabaseListPrefsStoreOptions = {},
): ListPrefsStore {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // Si `onAuthStateChange` ya ha dicho algo, es más reciente que la lectura
    // inicial: esta no debe pisarlo al resolver tarde.
    let heardFromListener = false
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      heardFromListener = true
      setUserId(session?.user.id ?? null)
    })
    client.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (active && !heardFromListener) setUserId(session?.user.id ?? null)
      })
      .catch(() => {
        // Sin sesión legible: nos quedamos solo con la caché local.
      })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  return useMemo(
    () =>
      createSupabaseListPrefsStore(client, userId, {
        table,
        onError: (error) => {
          const handler = onErrorRef.current
          if (handler) handler(error)
          else defaultOnError(error)
        },
      }),
    [client, userId, table],
  )
}

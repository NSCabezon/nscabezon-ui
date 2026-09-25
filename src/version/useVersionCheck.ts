import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useLabels, type Labels } from '../context/UiProvider'

// Detección PROACTIVA de deploys: el build publica un sello de versión (un
// fichero estático o un endpoint) y lo mismo se inyecta en el bundle. Una
// pestaña abierta lo consulta periódicamente y, si difiere, ofrece recargar
// antes de tropezar con un chunk obsoleto.

export const VERSION_POLL_INTERVAL_MS = 5 * 60_000
export const VERSION_FOCUS_THROTTLE_MS = 60_000

// Estado a nivel de módulo, para que el aviso no se repita aunque el efecto se
// re-monte (StrictMode, cambio de idioma…).
//
// Se guarda PARA QUÉ VERSIÓN se avisó, no un simple «ya avisé». Con un booleano,
// quien cerraba el aviso sin recargar dejaba la pestaña MUDA para siempre: al
// entrar una versión posterior la bandera ya estaba puesta y no se volvía a
// comprobar nada (pasó con dos releases seguidas el mismo día). Así se avisa
// una vez por versión: cerrarlo silencia esa, no las siguientes.
let notifiedVersion: string | null = null
let lastCheckAt = 0

/**
 * Lee `{ "version": "…" }` de una URL sin caché. Devuelve `null` ante
 * cualquier cosa rara: error HTTP, respuesta que no es JSON (un fallback SPA
 * que sirve index.html), campo ausente o vacío, o error de red.
 */
export async function fetchVersionJson(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return null
    const data: unknown = await res.json()
    const version = (data as { version?: unknown } | null)?.version
    return typeof version === 'string' && version.length > 0 ? version : null
  } catch {
    return null
  }
}

export type UseVersionCheckOptions = {
  /** Versión desplegada ahora mismo (o `null` si no se sabe). Puede lanzar: se ignora. */
  fetchVersion: () => Promise<string | null>
  /** Versión con la que se construyó este bundle. */
  currentVersion: string
  /** Solo en producción, normalmente. Por defecto `true`. */
  enabled?: boolean
  /** Textos del toast (`versionMessage`, `versionAction`); ganan al `UiProvider`. */
  labels?: Partial<Pick<Labels, 'versionMessage' | 'versionAction'>>
  /** Acción del toast. Por defecto, `location.reload()`. */
  onReload?: () => void
}

/**
 * Consulta la versión desplegada cada 5 min (más una comprobación inmediata
 * al montar, para no hacer esperar 5 min a una pestaña que ya estaba abierta)
 * y al recuperar foco/visibilidad (con throttle de 1 min); muestra un toast
 * persistente de sonner con acción «Actualizar» cuando hay una versión nueva.
 *
 * El efecto solo depende de `enabled`: `fetchVersion`, `currentVersion`, los
 * textos y `onReload` se leen de un ref actualizado en cada render. Si
 * estuvieran en las deps, cualquier cambio de identidad (un `t` nuevo de i18n
 * al cargar un namespace, una función inline) reiniciaría el `setInterval` de
 * 5 min — que entonces no llegaba a cumplirse nunca.
 */
export function useVersionCheck({
  fetchVersion,
  currentVersion,
  enabled = true,
  labels: labelsProp,
  onReload,
}: UseVersionCheckOptions) {
  const labels = useLabels(labelsProp)
  const latest = useRef({ fetchVersion, currentVersion, labels, onReload })
  // Los refs no se mutan durante el render: se actualiza en un efecto sin deps
  // que corre tras CADA render.
  useEffect(() => {
    latest.current = { fetchVersion, currentVersion, labels, onReload }
  })

  useEffect(() => {
    if (!enabled) return

    let disposed = false

    async function check() {
      lastCheckAt = Date.now()
      try {
        const version = await latest.current.fetchVersion()
        if (typeof version !== 'string' || version.length === 0) return
        const { currentVersion: current, labels: l, onReload: reload } = latest.current
        if (disposed || version === current || version === notifiedVersion) return
        notifiedVersion = version
        toast(l.versionMessage, {
          duration: Infinity,
          // Persistente: arriba, para no tapar los footers de acción pegados
          // al borde inferior.
          position: 'top-center',
          action: {
            label: l.versionAction,
            onClick: () => (reload ? reload() : location.reload()),
          },
        })
      } catch {
        // Errores de red del poll: silencio (sin toast ni console.error).
      }
    }

    void check()
    const intervalId = setInterval(() => void check(), VERSION_POLL_INTERVAL_MS)

    const onMaybeVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheckAt < VERSION_FOCUS_THROTTLE_MS) return
      void check()
    }
    window.addEventListener('focus', onMaybeVisible)
    document.addEventListener('visibilitychange', onMaybeVisible)

    return () => {
      disposed = true
      clearInterval(intervalId)
      window.removeEventListener('focus', onMaybeVisible)
      document.removeEventListener('visibilitychange', onMaybeVisible)
    }
  }, [enabled])
}

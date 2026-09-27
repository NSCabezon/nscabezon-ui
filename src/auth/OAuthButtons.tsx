import { useState } from 'react'
import { toast } from 'sonner'

import { useLabels, type Labels } from '../context/UiProvider'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { AppleIcon, GoogleIcon } from './icons'
import {
  DEFAULT_LAST_AUTH_METHOD_KEY,
  setLastAuthMethod,
  type AuthMethod,
  type OAuthProvider,
} from './lastAuthMethod'

/** Extras de `signInWithOAuth` que el componente deja configurar por proveedor. */
export type OAuthProviderOptions = {
  scopes?: string
  queryParams?: Record<string, string>
}

/**
 * Subconjunto del cliente de Supabase que usa el componente; tipado a mano para
 * no importar @supabase/supabase-js en runtime (mismo criterio que
 * SupabaseLikeAuthClient en prefs).
 */
export type OAuthSignInClient = {
  auth: {
    signInWithOAuth(credentials: {
      provider: OAuthProvider
      options?: { redirectTo?: string } & OAuthProviderOptions
    }): Promise<{ error: { message: string } | null }>
  }
}

export type OAuthButtonsProps = {
  client: OAuthSignInClient
  /**
   * URL absoluta de vuelta (p. ej. `${origin}/auth/callback?next=/x`). Función
   * para evaluarla al hacer click (window no existe en SSR).
   */
  redirectTo: string | (() => string)
  /** Por defecto ['google', 'apple'], en ese orden. */
  providers?: OAuthProvider[]
  /** Muestra la etiqueta «Última vez» en ese botón. */
  lastMethod?: AuthMethod | null
  /**
   * Recordar el proveedor elegido con `setLastAuthMethod`. `true` (clave por
   * defecto) | `false` | `{ storageKey }`. Por defecto `true`.
   */
  rememberLastMethod?: boolean | { storageKey: string }
  /** Antes de llamar a `signInWithOAuth` (p. ej. guardar un deep-link en sessionStorage). */
  onBeforeRedirect?: (provider: OAuthProvider) => void
  /** Fallo ANTES de redirigir al proveedor. Por defecto `toast.error(error.message)` de sonner. */
  onError?: (error: { message: string }, provider: OAuthProvider) => void
  /** Pinta el separador «o continúa con» encima. Por defecto `true`. */
  divider?: boolean
  /** Extras de `signInWithOAuth` (scopes, queryParams) por proveedor. */
  providerOptions?: Partial<Record<OAuthProvider, OAuthProviderOptions>>
  /** Textos (`oauthDivider`, `oauthGoogle`, `oauthApple`, `lastUsed`); ganan al `UiProvider`. */
  labels?: Partial<Pick<Labels, 'oauthDivider' | 'oauthGoogle' | 'oauthApple' | 'lastUsed'>>
  className?: string
}

const DEFAULT_PROVIDERS: OAuthProvider[] = ['google', 'apple']

const PROVIDER_UI: Record<
  OAuthProvider,
  { Icon: typeof GoogleIcon; labelKey: 'oauthGoogle' | 'oauthApple' }
> = {
  google: { Icon: GoogleIcon, labelKey: 'oauthGoogle' },
  apple: { Icon: AppleIcon, labelKey: 'oauthApple' },
}

/**
 * Botones «Continuar con Google / Apple» compartidos por Login y Signup.
 *
 * El callback (`/auth/callback`), las rutas post-login y la configuración de
 * los proveedores en Supabase son de cada app: aquí solo se lanza
 * `signInWithOAuth` y se recuerda, si procede, el método elegido.
 */
export function OAuthButtons({
  client,
  redirectTo,
  providers = DEFAULT_PROVIDERS,
  lastMethod,
  rememberLastMethod = true,
  onBeforeRedirect,
  onError,
  divider = true,
  providerOptions,
  labels: labelsProp,
  className,
}: OAuthButtonsProps) {
  const labels = useLabels(labelsProp)
  const [redirecting, setRedirecting] = useState(false)

  async function signIn(provider: OAuthProvider) {
    setRedirecting(true)
    // Se registra al iniciar el flujo (antes del round-trip al proveedor): el
    // éxito aterriza en el callback de la app, así que no hay un punto natural
    // de «OAuth OK» en este componente.
    if (rememberLastMethod) {
      const storageKey =
        typeof rememberLastMethod === 'object'
          ? rememberLastMethod.storageKey
          : DEFAULT_LAST_AUTH_METHOD_KEY
      setLastAuthMethod(provider, storageKey)
    }
    onBeforeRedirect?.(provider)
    const resolved = typeof redirectTo === 'function' ? redirectTo() : redirectTo
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: resolved, ...providerOptions?.[provider] },
    })
    // Solo llega aquí si falla ANTES de redirigir al proveedor.
    if (error) {
      if (onError) onError(error, provider)
      else toast.error(error.message)
      setRedirecting(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {divider && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{labels.oauthDivider}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
      <div className="space-y-2">
        {providers.map((provider) => {
          const { Icon, labelKey } = PROVIDER_UI[provider]
          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="relative w-full"
              data-provider={provider}
              disabled={redirecting}
              onClick={() => signIn(provider)}
            >
              <Icon />
              {labels[labelKey]}
              {lastMethod === provider && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-foreground px-1.5 py-0.5 text-xs font-semibold text-background shadow-sm">
                  {labels.lastUsed}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

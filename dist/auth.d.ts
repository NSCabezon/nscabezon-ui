import * as React from 'react';
import { b as Labels } from './UiProvider-CmLmG6Bj.js';

type OAuthProvider = 'google' | 'apple';
type AuthMethod = 'email' | OAuthProvider;
/** Clave de `localStorage` por defecto. Cada app puede pasar la suya. */
declare const DEFAULT_LAST_AUTH_METHOD_KEY = "ui.lastAuthMethod";
/** Último método usado, o `null` si no hay dato, no es válido o no hay storage. Nunca lanza. */
declare function getLastAuthMethod(storageKey?: string): AuthMethod | null;
/** Guarda el método. Si no hay storage (modo privado / bloqueado) se ignora: el hint es opcional. */
declare function setLastAuthMethod(method: AuthMethod, storageKey?: string): void;

/** Extras de `signInWithOAuth` que el componente deja configurar por proveedor. */
type OAuthProviderOptions = {
    scopes?: string;
    queryParams?: Record<string, string>;
};
/**
 * Subconjunto del cliente de Supabase que usa el componente; tipado a mano para
 * no importar @supabase/supabase-js en runtime (mismo criterio que
 * SupabaseLikeAuthClient en prefs).
 */
type OAuthSignInClient = {
    auth: {
        signInWithOAuth(credentials: {
            provider: OAuthProvider;
            options?: {
                redirectTo?: string;
            } & OAuthProviderOptions;
        }): Promise<{
            error: {
                message: string;
            } | null;
        }>;
    };
};
type OAuthButtonsProps = {
    client: OAuthSignInClient;
    /**
     * URL absoluta de vuelta (p. ej. `${origin}/auth/callback?next=/x`). Función
     * para evaluarla al hacer click (window no existe en SSR).
     */
    redirectTo: string | (() => string);
    /** Por defecto ['google', 'apple'], en ese orden. */
    providers?: OAuthProvider[];
    /** Muestra la etiqueta «Última vez» en ese botón. */
    lastMethod?: AuthMethod | null;
    /**
     * Recordar el proveedor elegido con `setLastAuthMethod`. `true` (clave por
     * defecto) | `false` | `{ storageKey }`. Por defecto `true`.
     */
    rememberLastMethod?: boolean | {
        storageKey: string;
    };
    /** Antes de llamar a `signInWithOAuth` (p. ej. guardar un deep-link en sessionStorage). */
    onBeforeRedirect?: (provider: OAuthProvider) => void;
    /** Fallo ANTES de redirigir al proveedor. Por defecto `toast.error(error.message)` de sonner. */
    onError?: (error: {
        message: string;
    }, provider: OAuthProvider) => void;
    /** Pinta el separador «o continúa con» encima. Por defecto `true`. */
    divider?: boolean;
    /** Extras de `signInWithOAuth` (scopes, queryParams) por proveedor. */
    providerOptions?: Partial<Record<OAuthProvider, OAuthProviderOptions>>;
    /** Textos (`oauthDivider`, `oauthGoogle`, `oauthApple`, `lastUsed`); ganan al `UiProvider`. */
    labels?: Partial<Pick<Labels, 'oauthDivider' | 'oauthGoogle' | 'oauthApple' | 'lastUsed'>>;
    className?: string;
};
/**
 * Botones «Continuar con Google / Apple» compartidos por Login y Signup.
 *
 * El callback (`/auth/callback`), las rutas post-login y la configuración de
 * los proveedores en Supabase son de cada app: aquí solo se lanza
 * `signInWithOAuth` y se recuerda, si procede, el método elegido.
 */
declare function OAuthButtons({ client, redirectTo, providers, lastMethod, rememberLastMethod, onBeforeRedirect, onError, divider, providerOptions, labels: labelsProp, className, }: OAuthButtonsProps): React.JSX.Element;

type AuthIconProps = {
    /** Por defecto `size-4`. */
    className?: string;
};
/** Logo de Google a cuatro colores (siempre igual: no depende del tema). */
declare function GoogleIcon({ className }: AuthIconProps): React.JSX.Element;
/** Logo de Apple en `currentColor` (sigue al texto del botón en claro y oscuro). */
declare function AppleIcon({ className }: AuthIconProps): React.JSX.Element;

export { AppleIcon, type AuthIconProps, type AuthMethod, DEFAULT_LAST_AUTH_METHOD_KEY, GoogleIcon, OAuthButtons, type OAuthButtonsProps, type OAuthProvider, type OAuthProviderOptions, type OAuthSignInClient, getLastAuthMethod, setLastAuthMethod };

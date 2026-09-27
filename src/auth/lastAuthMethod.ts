import { safeStorage } from '../lib/safeStorage'

// Recuerda el ÚLTIMO método de acceso usado en este navegador para mostrar un
// hint «Última vez» en la pantalla de login (estilo Google/Cloudflare). Es un
// dato puramente local por dispositivo: solo el método, nunca el correo.

export type OAuthProvider = 'google' | 'apple'
export type AuthMethod = 'email' | OAuthProvider

/** Clave de `localStorage` por defecto. Cada app puede pasar la suya. */
export const DEFAULT_LAST_AUTH_METHOD_KEY = 'ui.lastAuthMethod'

const AUTH_METHODS: readonly AuthMethod[] = ['email', 'google', 'apple']

function isAuthMethod(value: unknown): value is AuthMethod {
  return typeof value === 'string' && (AUTH_METHODS as readonly string[]).includes(value)
}

/** Último método usado, o `null` si no hay dato, no es válido o no hay storage. Nunca lanza. */
export function getLastAuthMethod(storageKey = DEFAULT_LAST_AUTH_METHOD_KEY): AuthMethod | null {
  const value = safeStorage.getItem(storageKey)
  return isAuthMethod(value) ? value : null
}

/** Guarda el método. Si no hay storage (modo privado / bloqueado) se ignora: el hint es opcional. */
export function setLastAuthMethod(
  method: AuthMethod,
  storageKey = DEFAULT_LAST_AUTH_METHOD_KEY,
): void {
  safeStorage.setItem(storageKey, method)
}

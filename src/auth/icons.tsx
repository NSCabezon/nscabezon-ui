import { cn } from '../lib/cn'

export type AuthIconProps = {
  /** Por defecto `size-4`. */
  className?: string
}

/** Logo de Google a cuatro colores (siempre igual: no depende del tema). */
export function GoogleIcon({ className }: AuthIconProps) {
  return (
    <svg className={cn('size-4', className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.99 11.99 0 0 0 1.27 6.62l4.01 3.09C6.22 6.87 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}

/** Logo de Apple en `currentColor` (sigue al texto del botón en claro y oscuro). */
export function AppleIcon({ className }: AuthIconProps) {
  return (
    <svg className={cn('size-4', className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.98 12.73c.03 3.22 2.82 4.29 2.85 4.3-.02.08-.44 1.53-1.47 3.03-.89 1.29-1.81 2.58-3.26 2.61-1.43.03-1.89-.85-3.52-.85-1.63 0-2.14.82-3.49.88-1.4.05-2.47-1.4-3.36-2.69-1.83-2.64-3.23-7.46-1.35-10.71a5.21 5.21 0 0 1 4.4-2.67c1.38-.03 2.68.93 3.52.93.84 0 2.42-1.15 4.08-.98.7.03 2.65.28 3.9 2.12-.1.06-2.33 1.36-2.3 4.03ZM14.3 4.87c.75-.9 1.25-2.16 1.11-3.41-1.07.04-2.37.72-3.14 1.62-.69.8-1.29 2.08-1.13 3.3 1.2.1 2.42-.6 3.16-1.51Z" />
    </svg>
  )
}

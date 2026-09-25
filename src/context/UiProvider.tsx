import * as React from 'react'

import type { ListPrefsStore } from '../prefs/stores'

/**
 * Textos visibles del paquete. Los que llevan números son funciones: así cada
 * app resuelve el plural y la interpolación con su propio sistema (Gesmoto,
 * `t('pagination.count', { count })`; TusExámenes, los valores por defecto).
 */
export type Labels = {
  /** Botón (aria-label/title) y nombre sr-only de la columna del menú de columnas. */
  columnsMenu: string
  /** Última opción del menú de columnas. */
  columnsReset: string
  paginationFirst: string
  paginationPrev: string
  paginationNext: string
  paginationLast: string
  /** «1–25 de 300». */
  paginationRange: (from: number, to: number, total: number) => string
  /** «1–25 de los primeros 300» (la consulta viene recortada por un tope). */
  paginationRangeTruncated: (from: number, to: number, total: number) => string
  /** «1 resultado» / «N resultados». */
  count: (count: number) => string
  /** «solo el primer resultado» / «solo los primeros N resultados». */
  countTruncated: (count: number) => string
  /** aria-label/title del selector de filas por página. */
  pageSizeLabel: string
  /** «25 por página». */
  pageSizeValue: (count: number) => string
  /** Anuncio sr-only con 0 resultados. */
  noResults: string
  /** Texto sr-only del spinner de carga del pie. */
  loading: string
  /** Toast de versión nueva. */
  versionMessage: string
  /** Acción del toast de versión nueva (recarga la página). */
  versionAction: string
}

export const defaultLabels: Labels = {
  columnsMenu: 'Columnas',
  columnsReset: 'Restablecer columnas',
  paginationFirst: 'Primera página',
  paginationPrev: 'Página anterior',
  paginationNext: 'Página siguiente',
  paginationLast: 'Última página',
  paginationRange: (from, to, total) => `${from}–${to} de ${total}`,
  paginationRangeTruncated: (from, to, total) => `${from}–${to} de los primeros ${total}`,
  count: (count) => (count === 1 ? '1 resultado' : `${count} resultados`),
  countTruncated: (count) =>
    count === 1 ? 'solo el primer resultado' : `solo los primeros ${count} resultados`,
  pageSizeLabel: 'Filas por página',
  pageSizeValue: (count) => `${count} por página`,
  noResults: 'Sin resultados',
  loading: 'Cargando…',
  versionMessage: 'Hay una versión nueva de la aplicación',
  versionAction: 'Actualizar',
}

/** Props mínimas que el paquete pasa al `Link` de la app. */
export type UiLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  className?: string
  children?: React.ReactNode
}

export type UiContextValue = {
  /** Enlace del router de la app (next/link, react-router…). Por defecto, un `<a>`. */
  Link: React.ComponentType<UiLinkProps>
  /** Navegación imperativa (click en el resto de la fila). Por defecto, `location.assign`. */
  navigate: (href: string) => void
  /** Textos resueltos (defecto español + lo que pase la app). */
  labels: Labels
  /** Almacén de preferencias de listado por defecto de `useListPrefs`. */
  listPrefsStore?: ListPrefsStore
}

function DefaultLink({ href, ...props }: UiLinkProps) {
  return <a href={href} {...props} />
}

function defaultNavigate(href: string) {
  window.location.assign(href)
}

const defaultValue: UiContextValue = {
  Link: DefaultLink,
  navigate: defaultNavigate,
  labels: defaultLabels,
}

const UiContext = React.createContext<UiContextValue>(defaultValue)

export type UiProviderProps = {
  Link?: React.ComponentType<UiLinkProps>
  navigate?: (href: string) => void
  labels?: Partial<Labels>
  listPrefsStore?: ListPrefsStore
  children?: React.ReactNode
}

type LabelKey = keyof Labels

/**
 * Igualdad «de forma» entre dos `labels` parciales: mismas claves, mismos
 * textos, y en las claves-función basta con que ambas sean función (se llaman
 * a través de un delegado que lee la última versión, ver `UiProvider`).
 */
function sameLabelShape(a: Partial<Labels> | undefined, b: Partial<Labels> | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const ka = Object.keys(a) as LabelKey[]
  const kb = Object.keys(b) as LabelKey[]
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    const va = a[k]
    const vb = b[k]
    if (typeof va === 'function' && typeof vb === 'function') continue
    if (va !== vb) return false
  }
  return true
}

/**
 * Integra el paquete con la app: router (Link + navigate), textos y almacén
 * de preferencias de listado. Todo es opcional; sin provider se usan `<a>`,
 * `location.assign`, los textos en español y preferencias solo locales.
 *
 * Estabilidad: el valor del contexto solo cambia cuando cambian `Link`,
 * `listPrefsStore` o el CONTENIDO de `labels` (claves y textos). Se pueden
 * pasar `navigate={(href) => router.push(href)}` y un objeto `labels` literal
 * sin memoizar: `navigate` y las etiquetas-función se exponen como delegados
 * estables que llaman siempre a la última versión recibida.
 */
export function UiProvider({ Link, navigate, labels, listPrefsStore, children }: UiProviderProps) {
  // Últimas props recibidas. Se escriben durante el render (no en un efecto)
  // porque las etiquetas-función se llaman al renderizar los hijos, en esta
  // misma pasada.
  const navigateRef = React.useRef(navigate)
  navigateRef.current = navigate
  const labelsRef = React.useRef(labels)
  labelsRef.current = labels

  const stableNavigate = React.useCallback((href: string) => {
    ;(navigateRef.current ?? defaultNavigate)(href)
  }, [])

  // `labels` estable mientras su forma no cambie (ver `sameLabelShape`).
  const [stableLabels, setStableLabels] = React.useState(labels)
  let shapeLabels = stableLabels
  if (!sameLabelShape(stableLabels, labels)) {
    // Patrón «ajustar estado durante el render»: React repite el render con el
    // valor nuevo sin pintar el intermedio.
    shapeLabels = labels
    setStableLabels(labels)
  }

  const resolvedLabels = React.useMemo<Labels>(() => {
    if (!shapeLabels) return defaultLabels
    const out: Record<string, unknown> = { ...defaultLabels }
    for (const k of Object.keys(shapeLabels) as LabelKey[]) {
      const v = shapeLabels[k]
      if (v === undefined) continue
      out[k] =
        typeof v === 'function'
          ? (...args: unknown[]) => {
              const latest = labelsRef.current?.[k]
              const fn = (typeof latest === 'function' ? latest : v) as (
                ...a: unknown[]
              ) => string
              return fn(...args)
            }
          : v
    }
    return out as Labels
  }, [shapeLabels])

  const value = React.useMemo<UiContextValue>(
    () => ({
      Link: Link ?? DefaultLink,
      navigate: stableNavigate,
      labels: resolvedLabels,
      listPrefsStore,
    }),
    [Link, stableNavigate, resolvedLabels, listPrefsStore],
  )
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiContextValue {
  return React.useContext(UiContext)
}

/** Textos efectivos: defecto < `UiProvider` < `override` (prop del componente). */
export function useLabels(override?: Partial<Labels>): Labels {
  const { labels } = useUi()
  return React.useMemo(() => (override ? { ...labels, ...override } : labels), [labels, override])
}

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
  paginationPrev: 'Anterior',
  paginationNext: 'Siguiente',
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

/**
 * Integra el paquete con la app: router (Link + navigate), textos y almacén
 * de preferencias de listado. Todo es opcional; sin provider se usan `<a>`,
 * `location.assign`, los textos en español y preferencias solo locales.
 */
export function UiProvider({ Link, navigate, labels, listPrefsStore, children }: UiProviderProps) {
  const value = React.useMemo<UiContextValue>(
    () => ({
      Link: Link ?? DefaultLink,
      navigate: navigate ?? defaultNavigate,
      labels: labels ? { ...defaultLabels, ...labels } : defaultLabels,
      listPrefsStore,
    }),
    [Link, navigate, labels, listPrefsStore],
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

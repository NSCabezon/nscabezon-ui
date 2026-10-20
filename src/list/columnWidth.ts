// Ancho compacto de una columna `action` (p.ej. borrar fila) cuando no tiene
// ancho guardado ni `width` propio: sin esto, table-fixed le repartía una
// parte igual que al resto — muy visible en columnas con cabecera vacía,
// donde ese hueco quedaba flotando junto al valor de la columna anterior.
export const DEFAULT_ACTION_COLUMN_WIDTH = 56

/**
 * Ancho por defecto (px) de una columna de un listado `resizable` que no trae
 * `width` ni ancho guardado (v0.9.0). Desde el modelo «como Excel» TODAS las
 * columnas tienen ancho efectivo; la de relleno usa este como base y se estira
 * encima.
 */
export const DEFAULT_COLUMN_WIDTH = 160

/** Suelo por defecto (px) de una columna redimensionable, si no trae `minWidth`. */
export const MIN_COLUMN_WIDTH = 64

/** Lo que las reglas de anchos necesitan saber de cada columna. */
export type SizedColumn = {
  key: string
  width?: number
  action?: boolean
  header?: unknown
  primary?: boolean
  /** Columna de relleno (v0.9.0): se estira para ocupar el hueco que sobre. */
  fill?: boolean
  /** @deprecated v0.9.0: alias de `fill`. */
  flex?: boolean
  minWidth?: number
}

/** ¿Es la columna de relleno? `fill`, o el alias deprecado `flex` (v0.5.0). */
export function isFillColumn(col: { fill?: boolean; flex?: boolean }): boolean {
  return !!(col.fill ?? col.flex)
}

/**
 * Columna de relleno de un listado `resizable`: la PRIMERA marcada con `fill`
 * (o `flex`) entre las visibles. Sin ninguna marcada, `undefined`: NO hay
 * relleno y, si las columnas no llegan al ancho del contenedor, queda hueco a
 * la derecha. Nunca se elige sola (ni la `primary`): la decide el consumidor.
 */
export function resolveFillColumnKey(columns: SizedColumn[]): string | undefined {
  return columns.find(isFillColumn)?.key
}

/** Ancho que la columna tendría sin nada guardado: su `width` o el por defecto. */
function defaultWidthOf(col: Omit<SizedColumn, 'key'>): number {
  return (
    col.width ?? (col.action && !col.header ? DEFAULT_ACTION_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH)
  )
}

/**
 * Suelo de una columna: su `minWidth` si lo trae; si no, `MIN_COLUMN_WIDTH`
 * (64), salvo que su propio ancho por defecto sea menor (un icono de 40 o 56
 * px no se infla a 64 por defecto).
 */
export function columnFloor(col: Omit<SizedColumn, 'key'>): number {
  return col.minWidth ?? Math.min(MIN_COLUMN_WIDTH, defaultWidthOf(col))
}

/**
 * Ancho efectivo (px) de una columna de un ResponsiveList `resizable`: lo
 * guardado/arrastrado gana; si no hay, su `width`; si tampoco, el ancho
 * compacto de una `action` SIN cabecera (icono suelto) o `DEFAULT_COLUMN_WIDTH`.
 * Nunca baja de `columnFloor`: un ancho guardado por debajo del suelo (p. ej.
 * una fecha guardada a 105 px que corta «19/10/2…») se pinta al suelo.
 *
 * En la columna de relleno es su ancho BASE: el que tiene cuando la tabla no
 * cabe; si sobra sitio, se estira por encima (ver `tableSizing`).
 */
export function resolveColumnWidth(col: Omit<SizedColumn, 'key'>, stored: number | undefined): number {
  return Math.max(stored ?? defaultWidthOf(col), columnFloor(col))
}

/**
 * Estilo de la `<table>` (table-fixed) para el modelo «como Excel + relleno»:
 * - Con columna de relleno: `width: 100%` y `min-width: suma`. La `<col>` del
 *   relleno va SIN ancho, así que table-fixed le da todo lo que sobre
 *   (tabla − resto de columnas); como la tabla nunca baja de la suma, ese
 *   sobrante nunca es menor que su base. Resultado: ancho = máx(contenedor,
 *   suma), el relleno solo crece y el resto no se mueve.
 * - Sin relleno: `width: suma` exacta. Con `width: 100%` table-fixed
 *   repartiría el sobrante entre TODAS las columnas; con la suma, queda hueco
 *   a la derecha.
 * Si la suma supera el contenedor, la tabla lo desborda y el contenedor de
 * scroll la desplaza a lo ancho.
 */
export function tableSizing(totalWidth: number, hasFill: boolean): {
  width: string | number
  minWidth?: number
} {
  return hasFill ? { width: '100%', minWidth: totalWidth } : { width: totalWidth }
}

/**
 * Columnas visibles: las ocultas por el usuario fuera, salvo la `primary`,
 * que nunca se oculta. Sin ocultas devuelve el mismo array.
 */
export function visibleColumnsOf<C extends { key: string; primary?: boolean }>(
  columns: C[],
  hidden: string[] | undefined,
): C[] {
  return hidden?.length ? columns.filter((c) => c.primary || !hidden.includes(c.key)) : columns
}

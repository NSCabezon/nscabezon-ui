// Ancho compacto de una columna `action` (p.ej. borrar fila) cuando no tiene
// ancho guardado ni `width` propio: sin esto, table-fixed le repartía una
// parte igual que al resto — muy visible en columnas con cabecera vacía,
// donde ese hueco quedaba flotando junto al valor de la columna anterior.
export const DEFAULT_ACTION_COLUMN_WIDTH = 56

/**
 * Ancho a aplicar en el <colgroup> de un ResponsiveList `resizable`: lo
 * guardado/arrastrado gana siempre; si no hay nada guardado, el `width` de la
 * columna; las `action` sin ninguno de los dos y SIN cabecera (icono suelto)
 * caen al ancho compacto por defecto. Una `action` CON cabecera es la
 * convención de un botón con texto: sin `width` propio se queda sin <col>
 * width y comparte el sobrante de table-fixed como cualquier otra columna.
 * `undefined` = "sin <col> width": la señal con la que table-fixed reparte el
 * sobrante en esa columna.
 */
export function resolveColumnWidth(
  col: { width?: number; action?: boolean; header?: unknown },
  stored: number | undefined,
): number | undefined {
  return stored ?? col.width ?? (col.action && !col.header ? DEFAULT_ACTION_COLUMN_WIDTH : undefined)
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

/** Ancho mínimo por defecto de la columna flexible, en px (ver `minWidth`). */
export const FLEX_MIN_COLUMN_WIDTH = 96

/** Lo que las reglas de la columna flexible necesitan saber de cada columna. */
export type SizedColumn = {
  key: string
  width?: number
  action?: boolean
  header?: unknown
  primary?: boolean
  flex?: boolean
  minWidth?: number
}

/**
 * Columna flexible de un listado `resizable`: la ÚNICA que gana o pierde
 * ancho cuando se arrastra otra o cambia el ancho de la ventana. Regla, sobre
 * las columnas VISIBLES y en orden:
 * 1. la primera marcada con `flex: true`;
 * 2. si ninguna, la `primary` si no tiene `width` ni es `action`;
 * 3. si no, la primera columna no-`action` sin `width`;
 * 4. si tampoco hay, ninguna (`undefined`): arrastrar cambia solo la columna
 *    arrastrada y table-fixed reparte la diferencia como antes de v0.5.0.
 */
export function resolveFlexColumnKey(columns: SizedColumn[]): string | undefined {
  const marked = columns.find((c) => c.flex)
  if (marked) return marked.key
  const primary = columns.find((c) => c.primary)
  if (primary && primary.width == null && !primary.action) return primary.key
  return columns.find((c) => !c.action && c.width == null)?.key
}

/**
 * Columna que compensa cuando se arrastra la PROPIA flexible: la última
 * columna no-`action` sin `width` (distinta de la flexible) y, si no hay, la
 * vecina de la derecha de la flexible (sea cual sea). `undefined` = la
 * flexible no tiene asa (es la última y no hay con quién compensar).
 *
 * Por qué la última sin `width` y no la vecina sin más: una columna sin
 * `width` es una de texto que el consumidor dejó crecer; las que traen `width`
 * (importes, fechas, estados) tienen el ancho pensado para su contenido.
 */
export function flexAbsorberKey(columns: SizedColumn[], flexKey: string): string | undefined {
  const free = columns.filter((c) => c.key !== flexKey && !c.action && c.width == null)
  if (free.length) return free[free.length - 1].key
  const i = columns.findIndex((c) => c.key === flexKey)
  return i >= 0 ? columns[i + 1]?.key : undefined
}

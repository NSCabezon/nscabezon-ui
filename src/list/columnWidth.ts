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

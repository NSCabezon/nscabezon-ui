// Orden de columnas elegido por el usuario (`ListPrefs.order`).
//
// Reglas:
// - `[]` (o sin orden) = orden de serie: devuelve el MISMO array.
// - Solo se mueven las columnas normales. Las `action` (menú de fila, badges
//   del slot de acciones) se quedan en su posición de serie —en la práctica, al
//   final— y no se pueden arrastrar ni subir/bajar.
// - Claves desconocidas del orden se ignoran; las columnas que el orden no
//   nombra (una columna nueva) van detrás de las que sí, en su orden de serie.

type OrderableColumn = { key: string; action?: boolean }

/** `columns` en el orden guardado (ver reglas arriba). */
export function orderColumns<C extends OrderableColumn>(
  columns: C[],
  order: readonly string[] | undefined,
): C[] {
  if (!order?.length) return columns
  const rank = new Map<string, number>()
  order.forEach((key, i) => {
    if (!rank.has(key)) rank.set(key, i)
  })
  const movable = columns
    .map((col, i) => ({ col, i }))
    .filter(({ col }) => !col.action)
    .sort(
      (a, b) =>
        (rank.get(a.col.key) ?? Infinity) - (rank.get(b.col.key) ?? Infinity) || a.i - b.i,
    )
    .map(({ col }) => col)
  let next = 0
  return columns.map((col) => (col.action ? col : movable[next++]))
}

/**
 * Nuevo orden (todas las claves de `columns`, en el orden resultante) tras
 * mover `from` a la posición de `to`: si `from` estaba antes, queda detrás de
 * `to`; si estaba después, delante. Las `action` no se mueven ni son destino:
 * en ese caso devuelve `null` (nada que guardar).
 */
export function moveColumn<C extends OrderableColumn>(
  columns: C[],
  order: readonly string[] | undefined,
  from: string,
  to: string,
): string[] | null {
  if (from === to) return null
  const ordered = orderColumns(columns, order)
  const movable = ordered.filter((c) => !c.action).map((c) => c.key)
  const fromIdx = movable.indexOf(from)
  const toIdx = movable.indexOf(to)
  if (fromIdx < 0 || toIdx < 0) return null
  movable.splice(fromIdx, 1)
  movable.splice(toIdx, 0, from)
  let next = 0
  return ordered.map((c) => (c.action ? c.key : movable[next++]))
}

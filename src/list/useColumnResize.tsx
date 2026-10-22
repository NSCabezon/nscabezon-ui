import * as React from 'react'

import {
  MIN_COLUMN_WIDTH,
  columnFloor,
  resolveColumnWidth,
  resolveFillColumnKey,
  tableSizing,
  type SizedColumn,
} from './columnWidth'
import { nodeText } from './nodeText'
import { useLabels, type Labels } from '../context/UiProvider'

// Reexportado aquí por compatibilidad: vivía en este módulo hasta v0.8.
export { MIN_COLUMN_WIDTH }

/** Atributo que marca cada `<th>` medible con la clave de su columna. */
export const COLUMN_WIDTH_KEY_ATTR = 'data-column-width-key'

type DragState = {
  key: string
  /** Ancho en vivo (px) de la columna arrastrada. */
  width: number
}

type DragRef = {
  key: string
  startX: number
  startW: number
  min: number
  /** El puntero ya se alejó `DRAG_THRESHOLD` px: es un arrastre, no un clic. */
  moved: boolean
}

/**
 * Px que tiene que moverse el puntero desde `pointerdown` para que el asa
 * cuente como arrastre (v0.9.4). Un clic sin mover (o con temblor de 1-2 px)
 * no guarda nada: con la zona de agarre ancha de v0.9.3, un clic que apuntaba
 * a ordenar y caía en el asa guardaba el ancho estirado del relleno (dejaba de
 * rellenar) o congelaba en px una columna que no se había tocado.
 */
const DRAG_THRESHOLD = 3

/** Paso (px) de ←/→ en el asa enfocada (v0.9.7): 1 rem. */
export const RESIZE_KEY_STEP = 16
/** Paso (px) de Mayús+←/→ en el asa enfocada (v0.9.7): 4 rem. */
export const RESIZE_KEY_STEP_LARGE = 64
/**
 * Techo (px) del teclado y `aria-valuemax` del asa (v0.9.7). El ratón no tiene
 * techo; si el ancho ya lo supera, `aria-valuemax` es el propio ancho.
 */
export const RESIZE_KEY_MAX = 1600

/**
 * Columnas redimensionables con el ratón: asa en el borde derecho de cada
 * cabecera, doble clic para devolverla a su ancho natural.
 *
 * Vive aparte de `ResponsiveList` porque también lo usan tablas a mano (p. ej.
 * una tabla de líneas con celdas editables). Los anchos se persisten con
 * `useListPrefs` (`setWidths`).
 *
 * Mecánica: pointer events CON captura, así el arrastre sigue aunque el puntero
 * salga de la celda. Mientras se arrastra el ancho vive en el estado local
 * (`drag`) y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Modelo «como Excel + relleno» (v0.9.0, con `columns`):
 * - Arrastrar el borde cambia SOLO esa columna; ninguna otra se mueve ni
 *   encoge, y no hay más tope que el suelo de la propia columna
 *   (`columnFloor`: su `minWidth` o 64 px).
 * - Todas las columnas tienen ancho efectivo (`resolveColumnWidth`): guardado,
 *   `width` o `DEFAULT_COLUMN_WIDTH`. `totalWidth` es su suma.
 * - La de relleno (`fill: true`, alias `flex`) tiene un ancho BASE como las
 *   demás (cuenta en la suma) y se estira encima si sobra sitio: su `<col>`
 *   va sin ancho (`colWidth` → `undefined`) y la tabla lleva `tableStyle`
 *   (`tableSizing`). Sin relleno, hueco a la derecha.
 *   Al arrastrar la de relleno se parte de su ancho PINTADO (medido del
 *   `<th>`, estiramiento incluido), para que el asa siga al puntero. Desde
 *   v0.9.3, en cuanto se arrastra deja de rellenar: su ancho guardado manda
 *   (se puede estrechar; queda hueco a la derecha) hasta el doble clic.
 * Sin `columns` (tablas a mano antiguas): cambia la arrastrada, partiendo del
 * ancho guardado o, si no hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 *
 * Teclado (v0.9.7, LIST-4): el asa `'end'` es un `role="separator"` enfocable
 * (`aria-orientation="vertical"`, `aria-label` = `labels.columnResize(columna)`,
 * `aria-valuenow/min/max` en px). ←/→ cambian 16 px (1 rem), Mayús+←/→ 64 px;
 * se ve en vivo y se guarda al soltar la tecla (o al perder el foco), por el
 * mismo `onColumnWidthsChange` que el arrastre y con el mismo suelo. Escape,
 * Supr o Retroceso borran el ancho guardado, como el doble clic. La mitad
 * `'start'` no es enfocable (sería la misma columna dos veces en el Tab).
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns,
  labels: labelsProp,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /** Columnas VISIBLES, en orden: activa el modelo «como Excel + relleno». */
  columns?: SizedColumn[]
  /** Textos propios (`columnResize`); ganan al `UiProvider`. */
  labels?: Partial<Labels>
}) {
  const labels = useLabels(labelsProp)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragRef | null>(null)
  // Teclado (v0.9.7): ancho en curso de ←/→ sobre el asa enfocada. Vive en
  // `drag` (en vivo) y se guarda al soltar la tecla o al perder el foco: una
  // tecla mantenida son decenas de `keydown` y una sola escritura.
  const keyRef = React.useRef<{ key: string; width: number } | null>(null)

  // Relleno «de reposo»: la columna `fill` mientras el usuario no le haya
  // guardado un ancho (v0.9.3, ver `resolveFillColumnKey`). Mientras se
  // ARRASTRA esa columna deja de rellenar ya (`fillKey` undefined): su `<col>`
  // sigue al puntero en vivo también al estrecharla, como quedará al soltar.
  const restingFillKey = columns ? resolveFillColumnKey(columns, columnWidths) : undefined
  const fillKey = drag?.key === restingFillKey ? undefined : restingFillKey
  const colOf = (key: string) => columns?.find((c) => c.key === key)

  /** Ancho efectivo sin arrastre (con `columns`): guardado/`width`/defecto, con suelo. */
  function baseWidth(key: string): number | undefined {
    const col = colOf(key)
    return col ? resolveColumnWidth(col, columnWidths?.[key]) : columnWidths?.[key]
  }

  /** Ancho vigente de una columna: el del arrastre en curso, o el guardado. */
  function widthOf(key: string): number | undefined {
    return drag?.key === key ? drag.width : columnWidths?.[key]
  }

  /**
   * Ancho de la columna en el modelo: el del arrastre en curso o el efectivo.
   * En la de relleno es su BASE (lo que cuenta en la suma).
   */
  function liveWidth(key: string): number | undefined {
    return drag?.key === key ? drag.width : baseWidth(key)
  }

  /**
   * Ancho para el `<col>`: el vivo de cada columna; la de relleno, ninguno
   * (`undefined`): table-fixed le da todo el sobrante.
   */
  function colWidth(key: string): number | undefined {
    if (key === fillKey) return undefined
    return liveWidth(key)
  }

  /** Suma de los anchos de `columns` (la de relleno, con su base). */
  const totalWidth = columns
    ? columns.reduce((sum, c) => sum + (liveWidth(c.key) ?? 0), 0)
    : undefined

  /** Estilo de la `<table>` para `extra` px fuera de `columns` (p. ej. una columna de selección). */
  function tableStyle(extra = 0): React.CSSProperties | undefined {
    return totalWidth == null ? undefined : tableSizing(totalWidth + extra, !!fillKey)
  }

  /**
   * `<th>` de `columnKey` (para medir su ancho pintado): la marcada con
   * `COLUMN_WIDTH_KEY_ATTR` en la misma fila; si la tabla no la marca, la que
   * contiene el asa (`'end'`) o la anterior a ella (`'start'`).
   */
  function headOf(handle: Element, columnKey: string, edge: 'end' | 'start'): Element | null {
    const own = handle.parentElement
    const row = handle.closest('tr')
    if (row) {
      for (const el of Array.from(row.querySelectorAll(`[${COLUMN_WIDTH_KEY_ATTR}]`))) {
        if (el.getAttribute(COLUMN_WIDTH_KEY_ATTR) === columnKey) return el
      }
    }
    return edge === 'start' ? (own?.previousElementSibling ?? null) : own
  }

  function clamp(d: DragRef, clientX: number) {
    return Math.round(Math.max(d.min, d.startW + clientX - d.startX))
  }

  /** Ancho de partida de un arrastre o de una tecla (px). */
  function startWidthOf(columnKey: string, th: Element | null): number {
    const measured = () => th?.getBoundingClientRect().width || undefined
    const col = colOf(columnKey)
    if (!col) return columnWidths?.[columnKey] ?? measured() ?? 0
    if (columnKey === restingFillKey) return Math.max(measured() ?? 0, baseWidth(columnKey)!)
    return baseWidth(columnKey)!
  }

  function floorOf(columnKey: string): number {
    const col = colOf(columnKey)
    return col ? columnFloor(col) : MIN_COLUMN_WIDTH
  }

  /** Guarda `px` para `key` (si cambia), igual que al soltar un arrastre. */
  function commit(key: string, px: number) {
    if (columnWidths?.[key] === px) return
    onColumnWidthsChange?.({ ...columnWidths, [key]: px })
  }

  /** Borra el ancho guardado de `key`: vuelve a su ancho de serie (doble clic, Escape/Supr). */
  function restore(key: string) {
    const next = { ...columnWidths }
    delete next[key]
    onColumnWidthsChange?.(next)
  }

  /** Guarda el ancho de teclado pendiente, si lo hay. */
  function flushKey() {
    const k = keyRef.current
    if (!k) return
    keyRef.current = null
    setDrag(null)
    commit(k.key, k.width)
  }

  function nameOf(columnKey: string, name?: string): string {
    return name ?? (nodeText(colOf(columnKey)?.header as React.ReactNode) || columnKey)
  }

  /**
   * Asa de redimensión. Va dentro de un `<th>` con `relative` (la propia asa es
   * `absolute`). Quien pinta la tabla decide en qué columnas ponerla.
   *
   * La línea se ve SIEMPRE (no solo al pasar por encima): un asa invisible hay
   * que buscarla a tientas con el ratón, y quien no sepa que existe no la
   * encuentra nunca. La zona de agarre sigue siendo más ancha que la línea.
   *
   * Devuelve JSX, NO un componente: un componente declarado aquí cambiaría de
   * identidad en cada render del hook, así que React desmontaría el asa en
   * cuanto el arrastre actualiza el ancho — y con ella, la captura del puntero.
   *
   * `edge` (v0.9.3): `'end'` (por defecto) es el asa de siempre, en el borde
   * derecho de la propia `<th>` de `columnKey`. `'start'` es la otra mitad de
   * la zona de agarre: va en el borde IZQUIERDO de la `<th>` SIGUIENTE y
   * redimensiona `columnKey` (la anterior). Hace falta porque la `<th>` lleva
   * `overflow-hidden` (no se puede sacar el asa por fuera) y, desde que las
   * cabeceras se arrastran para reordenar (v0.9.0), fallar el asa por 1 px a la
   * derecha de la línea agarraba la cabecera vecina y la MOVÍA. Con las dos
   * mitades la zona queda centrada en la línea, como en Excel. Sin línea
   * propia (la pinta el asa `'end'`), solo se resalta al pasar por encima.
   *
   * `name` (v0.9.7): nombre de la columna para el `aria-label` del asa. Por
   * defecto, el texto de su `header` en `columns` o, si no, su clave.
   */
  function resizeHandle(columnKey: string, edge: 'end' | 'start' = 'end', name?: string) {
    // Solo el asa `'end'` es enfocable: la `'start'` es la misma columna (otra
    // mitad de la zona de agarre) y sería una parada de Tab repetida.
    const focusable = edge === 'end'
    const now = focusable ? liveWidth(columnKey) : undefined
    const a11y: React.HTMLAttributes<HTMLSpanElement> = focusable
      ? {
          role: 'separator',
          tabIndex: 0,
          'aria-orientation': 'vertical',
          'aria-label': labels.columnResize(nameOf(columnKey, name)),
          'aria-valuenow': now,
          'aria-valuemin': floorOf(columnKey),
          'aria-valuemax': Math.max(RESIZE_KEY_MAX, now ?? 0),
        }
      : { role: 'presentation' }
    return (
      <span
        {...a11y}
        // Gancho para `ResponsiveList`: arrastrar desde el asa redimensiona,
        // nunca reordena la columna.
        data-column-resize-handle={edge === 'start' ? 'start' : ''}
        className={
          edge === 'start'
            ? "absolute inset-y-0 left-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:content-[''] hover:before:bg-muted-foreground"
            : // Foco visible (v0.9.7): la zona se tiñe y la línea pasa a ser
              // de 2 px a toda altura con el color del anillo de foco.
              "absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none outline-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground focus-visible:bg-ring/30 focus-visible:before:inset-y-0 focus-visible:before:w-0.5 focus-visible:before:bg-ring"
        }
        onKeyDown={
          focusable
            ? (e) => {
                // Teclado (v0.9.7): ←/→ 16 px (1 rem), Mayús+←/→ 64 px;
                // Escape/Supr/Retroceso vuelven al ancho de serie (como el
                // doble clic). Nada sube: ni ordena la cabecera ni la mueve.
                if (e.altKey || e.ctrlKey || e.metaKey) return
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  e.stopPropagation()
                  const step = e.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP
                  const from =
                    keyRef.current?.key === columnKey
                      ? keyRef.current.width
                      : startWidthOf(columnKey, headOf(e.currentTarget, columnKey, edge))
                  const delta = e.key === 'ArrowRight' ? step : -step
                  const width = Math.round(
                    Math.max(floorOf(columnKey), Math.min(Math.max(RESIZE_KEY_MAX, from), from + delta)),
                  )
                  keyRef.current = { key: columnKey, width }
                  setDrag({ key: columnKey, width })
                  return
                }
                if (e.key === 'Escape' || e.key === 'Delete' || e.key === 'Backspace') {
                  e.preventDefault()
                  e.stopPropagation()
                  keyRef.current = null
                  setDrag(null)
                  if (columnWidths?.[columnKey] != null) restore(columnKey)
                }
              }
            : undefined
        }
        onKeyUp={
          focusable
            ? (e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.stopPropagation()
                flushKey()
              }
            : undefined
        }
        onBlur={focusable ? flushKey : undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const th = headOf(e.currentTarget, columnKey, edge)
          const d: DragRef = {
            key: columnKey,
            startX: e.clientX,
            startW: startWidthOf(columnKey, th),
            min: floorOf(columnKey),
            moved: false,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = d
          // Sin `setDrag` todavía: hasta que el puntero se mueva es un clic y
          // nada cambia (ni el relleno deja de rellenar).
          e.preventDefault()
        }}
        onPointerMove={(e) => {
          const d = dragRef.current
          if (!d) return
          if (!d.moved && Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return
          d.moved = true
          setDrag({ key: d.key, width: clamp(d, e.clientX) })
        }}
        onPointerUp={(e) => {
          const d = dragRef.current
          if (!d) return
          dragRef.current = null
          setDrag(null)
          // Clic sin arrastre (v0.9.4): no se guarda nada. Doble clic sigue
          // llegando a `onDoubleClick` (dos clics sin mover).
          const moved = d.moved || Math.abs(e.clientX - d.startX) >= DRAG_THRESHOLD
          if (!moved) return
          commit(d.key, clamp(d, e.clientX))
        }}
        onPointerCancel={() => {
          dragRef.current = null
          setDrag(null)
        }}
        // Doble clic en el asa: la columna vuelve a su ancho natural (se borra
        // la preferencia, no se guarda un ancho "por defecto").
        onDoubleClick={() => restore(columnKey)}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return {
    widthOf,
    colWidth,
    fillKey,
    /** @deprecated v0.9.0: usa `fillKey`. */
    flexKey: fillKey,
    totalWidth,
    tableStyle,
    resizeHandle,
  }
}

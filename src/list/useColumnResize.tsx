import * as React from 'react'

import {
  MIN_COLUMN_WIDTH,
  columnFloor,
  resolveColumnWidth,
  resolveFillColumnKey,
  tableSizing,
  type SizedColumn,
} from './columnWidth'

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
}

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
 *   demás (cuenta en la suma y se guarda al arrastrarla) y se estira encima
 *   si sobra sitio: su `<col>` va sin ancho (`colWidth` → `undefined`) y la
 *   tabla lleva `tableStyle` (`tableSizing`). Sin relleno, hueco a la derecha.
 *   Al arrastrar la de relleno se parte de su ancho PINTADO (medido del
 *   `<th>`, estiramiento incluido), para que el asa siga al puntero.
 * Sin `columns` (tablas a mano antiguas): cambia la arrastrada, partiendo del
 * ancho guardado o, si no hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /** Columnas VISIBLES, en orden: activa el modelo «como Excel + relleno». */
  columns?: SizedColumn[]
}) {
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragRef | null>(null)

  const fillKey = columns ? resolveFillColumnKey(columns) : undefined
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

  function clamp(d: DragRef, clientX: number) {
    return Math.round(Math.max(d.min, d.startW + clientX - d.startX))
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
   */
  function resizeHandle(columnKey: string) {
    return (
      <span
        role="presentation"
        // Gancho para `ResponsiveList`: arrastrar desde el asa redimensiona,
        // nunca reordena la columna.
        data-column-resize-handle=""
        className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const th = e.currentTarget.parentElement
          const measured = () => th?.getBoundingClientRect().width || undefined
          const col = colOf(columnKey)
          let startW: number
          if (!col) startW = columnWidths?.[columnKey] ?? measured() ?? 0
          else if (columnKey === fillKey) {
            startW = Math.max(measured() ?? 0, baseWidth(columnKey)!)
          } else startW = baseWidth(columnKey)!
          const d: DragRef = {
            key: columnKey,
            startX: e.clientX,
            startW,
            min: col ? columnFloor(col) : MIN_COLUMN_WIDTH,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = d
          setDrag({ key: columnKey, width: clamp(d, e.clientX) })
          e.preventDefault()
        }}
        onPointerMove={(e) => {
          const d = dragRef.current
          if (!d) return
          setDrag({ key: d.key, width: clamp(d, e.clientX) })
        }}
        onPointerUp={(e) => {
          const d = dragRef.current
          if (!d) return
          const px = clamp(d, e.clientX)
          dragRef.current = null
          setDrag(null)
          onColumnWidthsChange?.({ ...columnWidths, [d.key]: px })
        }}
        onPointerCancel={() => {
          dragRef.current = null
          setDrag(null)
        }}
        // Doble clic en el asa: la columna vuelve a su ancho natural (se borra
        // la preferencia, no se guarda un ancho "por defecto").
        onDoubleClick={() => {
          const next = { ...columnWidths }
          delete next[columnKey]
          onColumnWidthsChange?.(next)
        }}
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

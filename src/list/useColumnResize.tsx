import * as React from 'react'

import {
  FLEX_MIN_COLUMN_WIDTH,
  flexAbsorberKey,
  resolveColumnWidth,
  resolveFlexColumnKey,
  type SizedColumn,
} from './columnWidth'

/** Ancho mínimo de una columna arrastrable, en px. */
export const MIN_COLUMN_WIDTH = 64

/** Atributo que marca cada `<th>` medible con la clave de su columna. */
export const COLUMN_WIDTH_KEY_ATTR = 'data-column-width-key'

type DragState = {
  key: string
  /** Anchos en vivo (px) mientras dura el arrastre. */
  widths: Record<string, number>
  /** Columna que va sin ancho durante el arrastre (la que compensa). */
  autoKey?: string
}

type DragRef = {
  key: string
  startX: number
  startW: number
  min: number
  max: number
  /** Columnas `auto` (sin ancho) fijadas en px al empezar, para que no se muevan. */
  pinned: Record<string, number>
  partner?: { key: string; startW: number | undefined }
}

/** Anchos medidos de las celdas hermanas marcadas con `data-column-width-key`. */
function measureRow(th: Element | null): Record<string, number> {
  const out: Record<string, number> = {}
  for (const cell of Array.from(th?.parentElement?.children ?? [])) {
    const key = cell.getAttribute(COLUMN_WIDTH_KEY_ATTR)
    if (!key) continue
    const w = cell.getBoundingClientRect().width
    if (w > 0) out[key] = w
  }
  return out
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
 * salga de la celda. El ancho inicial, si no hay uno guardado, se mide del
 * propio `<th>`. Mientras se arrastra el ancho vive en el estado local (`drag`)
 * y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Columna flexible (v0.5.0, con `columns`): la tabla llena siempre el ancho y
 * la diferencia de un arrastre la gana o la pierde SOLO la columna flexible
 * (ver `resolveFlexColumnKey`); las demás se quedan como estaban (las que iban
 * sin ancho se fijan en px al empezar, medidas de los `<th>` con
 * `data-column-width-key`). La flexible nunca se guarda en px: queda sin
 * ancho y es la única que cambia con el tamaño de la ventana. No baja de su
 * `minWidth` (o `FLEX_MIN_COLUMN_WIDTH`): llegado ahí, la arrastrada deja de
 * crecer. Arrastrar la propia flexible lo compensa `flexAbsorberKey`. Sin
 * `columns` (tablas a mano antiguas) o sin columna flexible, el comportamiento
 * es el de antes: cambia la arrastrada y table-fixed reparte.
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /** Columnas VISIBLES, en orden: activa el modo de columna flexible. */
  columns?: SizedColumn[]
}) {
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragRef | null>(null)

  const flexKey = columns ? resolveFlexColumnKey(columns) : undefined
  const flexCol = flexKey ? columns?.find((c) => c.key === flexKey) : undefined
  const flexMin = flexCol?.minWidth ?? FLEX_MIN_COLUMN_WIDTH
  const absorberKey = columns && flexKey ? flexAbsorberKey(columns, flexKey) : undefined

  /** Ancho sin arrastre: guardado > `width` > compacto de `action`; la flexible, ninguno. */
  function baseWidth(key: string): number | undefined {
    if (key === flexKey) return undefined
    const col = columns?.find((c) => c.key === key)
    return col ? resolveColumnWidth(col, columnWidths?.[key]) : columnWidths?.[key]
  }

  /** Ancho vigente de una columna: el del arrastre en curso, o el guardado. */
  function widthOf(key: string): number | undefined {
    return drag?.widths[key] ?? columnWidths?.[key]
  }

  /**
   * Ancho resuelto para el `<col>` (con `columns`): el del arrastre en curso,
   * o `resolveColumnWidth`; la flexible (y la que compensa mientras se arrastra
   * la flexible) va sin ancho. `undefined` = sin `<col>` width.
   */
  function colWidth(key: string): number | undefined {
    if (drag) {
      if (key in drag.widths) return drag.widths[key]
      if (key === drag.autoKey) return undefined
    }
    return baseWidth(key)
  }

  function clamp(d: DragRef, clientX: number) {
    return Math.round(Math.max(d.min, Math.min(d.max, d.startW + clientX - d.startX)))
  }

  function liveWidths(d: DragRef, px: number): Record<string, number> {
    return { ...d.pinned, [d.key]: px }
  }

  /**
   * Asa de redimensión. Va dentro de un `<th>` con `relative` (la propia asa es
   * `absolute`), y no se pinta en la última columna visible: arrastrarla no
   * tendría contra qué repartir. Con columna flexible, la flexible no lleva asa
   * si no hay columna que la compense (devuelve `null`).
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
    if (flexKey && columnKey === flexKey && !absorberKey) return null
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
          const measured = flexKey ? measureRow(th) : {}
          const isFlex = !!flexKey && columnKey === flexKey
          const startW =
            (isFlex ? measured[columnKey] : (columnWidths?.[columnKey] ?? measured[columnKey])) ??
            th?.getBoundingClientRect().width ??
            0
          const d: DragRef = {
            key: columnKey,
            startX: e.clientX,
            startW,
            min: isFlex ? flexMin : MIN_COLUMN_WIDTH,
            max: Infinity,
            pinned: {},
          }
          if (flexKey && columns) {
            const partnerKey = isFlex ? absorberKey! : flexKey
            const partnerStart =
              measured[partnerKey] ?? (isFlex ? baseWidth(partnerKey) : undefined)
            const partnerMin = isFlex ? MIN_COLUMN_WIDTH : flexMin
            d.partner = { key: partnerKey, startW: partnerStart }
            if (partnerStart != null) d.max = startW + Math.max(0, partnerStart - partnerMin)
            for (const c of columns) {
              if (c.key === columnKey || c.key === flexKey || c.key === partnerKey) continue
              if (baseWidth(c.key) == null && measured[c.key] != null) {
                d.pinned[c.key] = Math.round(measured[c.key])
              }
            }
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = d
          setDrag({
            key: columnKey,
            widths: liveWidths(d, clamp(d, e.clientX)),
            autoKey: d.partner?.key,
          })
          e.preventDefault()
        }}
        onPointerMove={(e) => {
          const d = dragRef.current
          if (!d) return
          setDrag({ key: d.key, widths: liveWidths(d, clamp(d, e.clientX)), autoKey: d.partner?.key })
        }}
        onPointerUp={(e) => {
          const d = dragRef.current
          if (!d) return
          const px = clamp(d, e.clientX)
          dragRef.current = null
          setDrag(null)
          if (!flexKey) {
            onColumnWidthsChange?.({ ...columnWidths, [d.key]: px })
            return
          }
          // La flexible nunca se guarda en px: así absorbe el ancho de la ventana.
          const next = { ...columnWidths, ...d.pinned }
          delete next[flexKey]
          if (d.key !== flexKey) next[d.key] = px
          else if (d.partner?.startW != null) {
            next[d.partner.key] = Math.max(
              MIN_COLUMN_WIDTH,
              Math.round(d.partner.startW - (px - d.startW)),
            )
          }
          onColumnWidthsChange?.(next)
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

  return { widthOf, colWidth, flexKey, resizeHandle }
}

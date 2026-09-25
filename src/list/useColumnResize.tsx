import * as React from 'react'

/** Ancho mínimo de una columna arrastrable, en px. */
export const MIN_COLUMN_WIDTH = 64

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
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
}) {
  const [drag, setDrag] = React.useState<{ key: string; px: number } | null>(null)
  const dragRef = React.useRef<{ key: string; startX: number; startW: number } | null>(null)

  /** Ancho vigente de una columna: el del arrastre en curso, o el guardado. */
  function widthOf(key: string): number | undefined {
    return drag?.key === key ? drag.px : columnWidths?.[key]
  }

  /**
   * Asa de redimensión. Va dentro de un `<th>` con `relative` (la propia asa es
   * `absolute`), y no se pinta en la última columna visible: arrastrarla no
   * tendría contra qué repartir.
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
        className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const th = e.currentTarget.parentElement
          const startW = columnWidths?.[columnKey] ?? th?.getBoundingClientRect().width ?? 0
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = { key: columnKey, startX: e.clientX, startW }
          setDrag({ key: columnKey, px: Math.max(MIN_COLUMN_WIDTH, Math.round(startW)) })
          e.preventDefault()
        }}
        onPointerMove={(e) => {
          const d = dragRef.current
          if (!d) return
          setDrag({
            key: d.key,
            px: Math.max(MIN_COLUMN_WIDTH, Math.round(d.startW + e.clientX - d.startX)),
          })
        }}
        onPointerUp={(e) => {
          const d = dragRef.current
          if (!d) return
          const px = Math.max(MIN_COLUMN_WIDTH, Math.round(d.startW + e.clientX - d.startX))
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

  return { widthOf, resizeHandle }
}

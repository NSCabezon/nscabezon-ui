import * as React from 'react'
import { Columns3 } from 'lucide-react'

import { Button } from '../primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useLabels, type Labels } from '../context/UiProvider'

export type ColumnsMenuColumn = {
  key: string
  // Etiqueta del checkbox. Sin `header` la columna no sale en el menú (la de
  // acciones, la de restaurar…).
  header?: React.ReactNode
  // La columna `primary` no se puede ocultar: sale marcada y deshabilitada.
  primary?: boolean
}

export type ColumnsMenuProps = {
  columns: ColumnsMenuColumn[]
  hidden: string[]
  onHiddenChange: (hidden: string[]) => void
  onReset: () => void
  className?: string
  /**
   * Modo compacto (opt-in): con `onCompactChange`, el menú pinta la casilla
   * «Modo compacto» encima de «Restablecer columnas». Sin él, nada cambia.
   */
  compact?: boolean
  onCompactChange?: (compact: boolean) => void
  /** Textos propios (`columnsMenu`, `columnsReset`, `compactMode`); ganan al `UiProvider`. */
  labels?: Partial<Pick<Labels, 'columnsMenu' | 'columnsReset' | 'compactMode'>>
}

// Selector de columnas visibles de un `ResponsiveList` (prop `hiddenColumns`).
// Botón icono + menú con un checkbox por columna y «Restablecer columnas», que
// delega en `onReset` (el consumidor limpia ocultas Y anchos guardados). Con
// `onCompactChange`, además, la casilla «Modo compacto» (no la toca el reset).
export function ColumnsMenu({
  columns,
  hidden,
  onHiddenChange,
  onReset,
  className,
  compact,
  onCompactChange,
  labels: labelsProp,
}: ColumnsMenuProps) {
  const labels = useLabels(labelsProp)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={labels.columnsMenu}
          title={labels.columnsMenu}
          className={className}
        >
          <Columns3 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Sin cabecera no hay etiqueta que enseñar (columnas de acciones y de
            restaurar): se filtran aquí para no pintar una casilla vacía o con
            la clave interna. */}
        {columns
          .filter((col) => col.header)
          .map((col) => {
            const visible = !!col.primary || !hidden.includes(col.key)
            return (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visible}
                disabled={col.primary}
                // Marcar/desmarcar no cierra el menú: lo normal es tocar varias.
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => {
                  const rest = hidden.filter((k) => k !== col.key)
                  onHiddenChange(checked ? rest : [...rest, col.key])
                }}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            )
          })}
        {onCompactChange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!!compact}
              data-compact-toggle
              // Igual que las casillas de columnas: alternar no cierra el menú.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(checked) => onCompactChange(checked === true)}
            >
              {labels.compactMode}
            </DropdownMenuCheckboxItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onReset()}>{labels.columnsReset}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import * as React from 'react'
import { ChevronDown, ChevronUp, Columns3 } from 'lucide-react'

import { Button } from '../primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { nodeText } from './nodeText'
import { useLabels, type Labels } from '../context/UiProvider'
import { LIST_PAGE_SIZES } from '../prefs/listPrefs'
import { moveColumn, orderColumns } from './columnOrder'

export type ColumnsMenuColumn = {
  key: string
  // Etiqueta del checkbox. Sin `header` la columna no sale en el menú (la de
  // acciones, la de restaurar…).
  header?: React.ReactNode
  // La columna `primary` no se puede ocultar: sale marcada y deshabilitada.
  primary?: boolean
  // Las `action` no se reordenan: salen sin botones «Subir»/«Bajar».
  action?: boolean
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
  /**
   * Orden de columnas (opt-in): el menú lista las columnas en `columnOrder`
   * (ver `orderColumns`) y, con `onColumnOrderChange`, cada columna no-`action`
   * lleva «Subir»/«Bajar» (deshabilitados en los extremos, sin cerrar el menú).
   * El callback recibe todas las claves de `columns` en el orden nuevo.
   */
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  /**
   * Filas por página (opt-in, v0.7.0): con `onPageSizeChange`, el menú pinta
   * el submenú «Filas por página» › 10 · 25 · 50 · 100 (`LIST_PAGE_SIZES`,
   * radio con `pageSize` marcado) entre «Modo compacto» y «Restablecer
   * columnas». Sin él, nada cambia. Elegir un tamaño cierra el menú.
   */
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  /** Textos propios; ganan al `UiProvider`. */
  labels?: Partial<
    Pick<
      Labels,
      'columnsMenu' | 'columnsReset' | 'compactMode' | 'columnMoveUp' | 'columnMoveDown' | 'pageSizeMenu'
    >
  >
}

// Selector de columnas visibles de un `ResponsiveList` (prop `hiddenColumns`).
// Botón icono + menú con un checkbox por columna y «Restablecer columnas», que
// delega en `onReset` (el consumidor limpia ocultas Y anchos guardados). Con
// `onCompactChange`, además, la casilla «Modo compacto» (no la toca el reset).
// Con `onColumnOrderChange`, «Subir»/«Bajar» por columna: la vía de teclado
// para reordenar (en escritorio también se arrastra la cabecera). Con
// `onPageSizeChange`, el submenú «Filas por página» (v0.7.0: el selector salió
// del pie del listado para vivir aquí).
//
// Submenú también en táctil: el `SubTrigger` de Radix abre con `click` (un
// toque lo dispara) además de con hover de ratón y con →/Enter/Espacio, así que
// no hace falta un grupo de radio plano para móvil. El `SubContent` va en un
// portal (sale del `overflow` del menú padre) y con `collisionPadding`: a 390 px
// no cabe a la derecha del menú y Radix lo voltea a la izquierda.
export function ColumnsMenu({
  columns,
  hidden,
  onHiddenChange,
  onReset,
  className,
  compact,
  onCompactChange,
  columnOrder,
  onColumnOrderChange,
  pageSize,
  onPageSizeChange,
  labels: labelsProp,
}: ColumnsMenuProps) {
  const labels = useLabels(labelsProp)
  const ordered = orderColumns(columns, columnOrder)
  // Columnas que se pueden mover (las no-`action`), en el orden vigente: los
  // extremos y el vecino de «Subir»/«Bajar» se miden sobre esta lista.
  const movable = ordered.filter((c) => !c.action).map((c) => c.key)
  function move(key: string, delta: -1 | 1) {
    if (!onColumnOrderChange) return
    const target = movable[movable.indexOf(key) + delta]
    if (target === undefined) return
    const next = moveColumn(columns, columnOrder, key, target)
    if (next) onColumnOrderChange(next)
  }
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
      <DropdownMenuContent align="end" className={onColumnOrderChange ? 'w-64' : 'w-56'}>
        {/* Sin cabecera no hay etiqueta que enseñar (columnas de acciones y de
            restaurar): se filtran aquí para no pintar una casilla vacía o con
            la clave interna. */}
        {ordered
          .filter((col) => col.header)
          .map((col) => {
            const visible = !!col.primary || !hidden.includes(col.key)
            const checkbox = (
              <DropdownMenuCheckboxItem
                key={col.key}
                className={onColumnOrderChange ? 'min-w-0 flex-1' : undefined}
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
            if (!onColumnOrderChange) return checkbox
            // «Subir»/«Bajar» son items del menú (no <button> sueltos): Radix
            // solo navega con flechas entre items y bloquea el Tab, así que es
            // la única forma de que el reordenado por teclado sea alcanzable.
            // `preventDefault` en onSelect: mover no cierra el menú.
            const name = nodeText(col.header) || col.key
            const pos = movable.indexOf(col.key)
            const moveButton = (delta: -1 | 1) => {
              const label = delta < 0 ? labels.columnMoveUp(name) : labels.columnMoveDown(name)
              const Icon = delta < 0 ? ChevronUp : ChevronDown
              return (
                <DropdownMenuItem
                  aria-label={label}
                  title={label}
                  data-column-move={delta < 0 ? 'up' : 'down'}
                  className="size-7 shrink-0 justify-center p-0"
                  disabled={delta < 0 ? pos <= 0 : pos >= movable.length - 1}
                  onSelect={(e) => {
                    e.preventDefault()
                    move(col.key, delta)
                  }}
                >
                  <Icon aria-hidden />
                </DropdownMenuItem>
              )
            }
            return (
              <div key={col.key} className="flex items-center gap-0.5" data-column-row={col.key}>
                {checkbox}
                {!col.action && pos >= 0 && (
                  <>
                    {moveButton(-1)}
                    {moveButton(1)}
                  </>
                )}
              </div>
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
        {onPageSizeChange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger data-page-size-menu>{labels.pageSizeMenu}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent collisionPadding={8}>
                  <DropdownMenuRadioGroup
                    value={pageSize === undefined ? undefined : String(pageSize)}
                    onValueChange={(v) => onPageSizeChange(Number(v))}
                  >
                    {LIST_PAGE_SIZES.map((size) => (
                      <DropdownMenuRadioItem
                        key={size}
                        value={String(size)}
                        className="tabular-nums"
                      >
                        {size}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onReset()}>{labels.columnsReset}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

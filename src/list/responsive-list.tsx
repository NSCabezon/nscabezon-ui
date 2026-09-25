import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '../lib/cn'
import { ColumnsMenu } from './columns-menu'
import { useColumnResize } from './useColumnResize'
import { TINTED_ROW_CLASS } from './rowTone'
import { resolveColumnWidth, visibleColumnsOf } from './columnWidth'
import { useLabels, useUi, type Labels } from '../context/UiProvider'
import type { ListSort, SortDir } from '../prefs/listPrefs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../primitives/table'

export type { ListSort, SortDir }

export type ResponsiveColumn<T> = {
  // Stable identifier for the column.
  key: string
  // Header label (table head + the label shown next to the value in mobile cards).
  header?: React.ReactNode
  // Cell renderer.
  cell: (row: T) => React.ReactNode
  // Card title on mobile (rendered prominently, without a label).
  primary?: boolean
  // Pinned to the card's top-right action slot on mobile (e.g. status badge, row menu).
  action?: boolean
  // Omitted from the mobile card (still shown in the desktop table).
  hideOnMobile?: boolean
  // Render as a full-width block row in the mobile card, with label above value.
  mobileFullWidth?: boolean
  // Hide the mobile label for columns whose value is self-explanatory (e.g. a button row).
  mobileHideLabel?: boolean
  // Omite la fila label/valor de la tarjeta móvil cuando no hay nada que
  // decir para ESTA fila (p. ej. «Moto —»): la tabla sigue pintando su guion,
  // que ahí mantiene la columna alineada .
  mobileHideWhen?: (row: T) => boolean
  // Solo para la columna `primary`: no la envuelvas en el <Link> de `rowHref`.
  // Para celdas que ya traen enlaces propios (anclas anidadas = HTML inválido y
  // foco anidado). Quien lo use debe poner su propio <Link> al destino de la
  // fila, o esa fila se queda sin acceso por teclado.
  noRowLink?: boolean
  // La cabecera de escritorio pasa a ser un botón que ordena por esta columna.
  // Solo hace algo si la lista recibe `sort` + `onSortChange` (orden servidor).
  sortable?: boolean
  // Extra classes for the desktop <th>.
  headClassName?: string
  // Extra classes for the desktop <td>.
  cellClassName?: string
  // Ancho por defecto (px) en el <colgroup> de `resizable` mientras el usuario
  // no haya arrastrado esta columna (`columnWidths` siempre gana). Las
  // columnas `action` SIN cabecera (icono suelto) lo ignoran: ver
  // `DEFAULT_ACTION_COLUMN_WIDTH`; una `action` con cabecera es un botón con
  // texto y necesita su propio `width` (o se queda sin <col> width y comparte
  // el sobrante). Para que una columna absorba el espacio sobrante de
  // table-fixed, no le pongas `width` — ver la nota junto al <colgroup>.
  width?: number
}

export type ResponsiveListProps<T> = {
  columns: ResponsiveColumn<T>[]
  data: T[]
  rowKey: (row: T) => React.Key
  // Destino de la fila cuando lleva a una página de detalle. Hace clicable la
  // fila ENTERA y, a diferencia de `onRowClick`, se comporta como un enlace de
  // verdad: cmd/ctrl+click y click de rueda abren en pestaña nueva, y la
  // columna `primary` se envuelve en un <Link> real (foco por teclado, Enter,
  // "abrir en pestaña nueva" y "copiar dirección" del menú contextual).
  // Devolver undefined deja la fila inerte (p.ej. una cita sin moto asociada).
  rowHref?: (row: T) => string | undefined
  // Solo para filas que NO navegan: abrir un diálogo, seleccionar. Si la fila
  // va a una ruta, usa `rowHref` — este camino pierde el cmd+click y monta un
  // role="button" sobre el <tr>, que rompe la semántica de tabla.
  onRowClick?: (row: T) => void
  // Manejadores de RATÓN por fila (opt-in). Pensado para colgar un avance
  // (popover) del hover de la fila ENTERA sin meter un disparador interactivo
  // dentro de ella: con `rowHref` la fila ya es un enlace (el <Link> de la
  // columna `primary` + los handlers del <tr>), y anidar ahí un botón rompería
  // el HTML y el foco. El consumidor pone los handlers aquí y ancla su popover
  // al elemento que recibe el evento (`e.currentTarget`, p.ej. con el
  // `virtualRef` de PopoverAnchor).
  //
  // Solo hover: no acepta click ni foco a propósito — el click de la fila es de
  // `rowHref`/`onRowClick`, y lo que se enseñe al pasar el ratón no puede ser
  // la única vía de nada (en táctil no existe el hover). Se aplica igual a la
  // fila de escritorio y a la tarjeta móvil.
  rowHoverProps?: (row: T) => {
    onMouseEnter?: React.MouseEventHandler<HTMLElement>
    onMouseLeave?: React.MouseEventHandler<HTMLElement>
  }
  // Optional leading content per row (e.g. a selection checkbox).
  leading?: (row: T) => React.ReactNode
  // Marks a row as selected (adds the table's selected styling + card ring).
  isRowSelected?: (row: T) => boolean
  // Extra classes for a row, applied to both the desktop <TableRow> and the mobile card.
  rowClassName?: (row: T) => string | undefined
  // Fila coloreada (opt-in). Si devuelve un estilo, la fila de escritorio y la
  // tarjeta móvil lo reciben tal cual y además las clases
  // `bg-(--row-tint) hover:bg-(--row-tint-hover)` + franja izquierda
  // `shadow-[inset_3px_0_0_var(--row-accent)]`: el consumidor rellena esas tres
  // variables CSS en el estilo. La fila seleccionada sigue ganando (bg-muted).
  rowStyle?: (row: T) => React.CSSProperties | undefined
  // Orden servidor (opt-in): estado actual + callback. Solo las columnas con
  // `sortable` pintan cabecera-botón. Ciclo: sin orden → asc, asc → desc,
  // desc → asc (nunca "sin orden": la lista siempre viene ordenada del servidor).
  sort?: ListSort | null
  onSortChange?: (next: ListSort) => void
  // Anchos de columna (opt-in). Con `resizable` la tabla pasa a `table-fixed`
  // con un <colgroup> y cada <th> menos el último lleva un asa de arrastre en
  // su borde derecho. `columnWidths` es el mapa persistido (px por `key`);
  // `onColumnWidthsChange` recibe el mapa completo al soltar (mínimo 64px) y
  // sin esa clave al hacer doble click en el asa.
  resizable?: boolean
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  // Columnas ocultas por el usuario (opt-in): se filtran en tabla y tarjetas.
  // La columna `primary` nunca se oculta.
  hiddenColumns?: string[]
  // Menú de columnas incrustado (opt-in): con AMBOS callbacks, la tabla de
  // escritorio pinta una columna extra al final con el `ColumnsMenu` dentro.
  // Esa columna no se guarda, no ordena y no se puede ocultar a sí misma; en
  // móvil no hay cabecera: el menú va encima de las tarjetas (ver
  // `mobileColumnsMenu`).
  onHiddenColumnsChange?: (hidden: string[]) => void
  onColumnsReset?: () => void
  // En móvil (cards) pinta el menú de columnas encima de las tarjetas,
  // alineado a la derecha. Requiere los dos callbacks de arriba. Por defecto
  // SÍ (con los callbacks); pasa `false` cuando la lista va con `ListFooter`,
  // que ya pinta el menú en móvil (`useListView` paginado lo hace solo en
  // `listProps`).
  mobileColumnsMenu?: boolean
  // Pins the desktop table header (thead) at the top while the list scrolls. Intended
  // for a list rendered inside its own vertical scroll container (`overflow-y-auto`),
  // so the header sticks to that container's top. `stickyHeaderTop` overrides the CSS
  // `top` (px) if the header must pin below something.
  stickyHeader?: boolean
  stickyHeaderTop?: number
  className?: string
  // Textos propios (menú de columnas); ganan al `UiProvider`.
  labels?: Partial<Labels>
}

// Área de toque de 44 px (WCAG 2.5.5) para un ENLACE DE TEXTO que es el título
// de una tarjeta o fila —el nombre del cliente, la matrícula— sin cambiar la
// altura de la fila: con dedo (`pointer: coarse`) el <a> crece a 44 px por
// padding y los márgenes negativos devuelven esos 24 px al flujo, así que
// escritorio y móvil se pintan igual que sin esto y ~40 listados no cambian
// de alto. Pensado para un <a> `block` que sea hijo directo de un contenedor
// SIN `overflow-hidden` (un `truncate` en el padre recortaría justo la zona
// que se está ganando; el `truncate` va en el propio <a>). Para varios enlaces
// APILADOS no sirve —cada uno taparía el área del anterior—: ahí cada uno crece
// de verdad (`pointer-coarse:flex pointer-coarse:min-h-11`).
// `min-w-11` + `-mx-3/px-3`: un título corto («#2») en una fila flex solo mide
// lo que mide su texto (18 px de ancho); el padding horizontal negativo/positivo
// ensancha el toque sin mover el texto ni la tarjeta.
export const TOUCH_TEXT_LINK =
  'pointer-coarse:-my-3 pointer-coarse:min-h-11 pointer-coarse:py-3 pointer-coarse:-mx-3 pointer-coarse:min-w-11 pointer-coarse:px-3'

// Renders a data table on desktop (md+) and a stacked list of cards on mobile.
// Both variants share the same column definitions; the mobile card shows each
// column as a label/value pair, except `primary` (title) and `action` (top-right).
export function ResponsiveList<T>({
  columns,
  data,
  rowKey,
  rowHref,
  onRowClick,
  rowHoverProps,
  leading,
  isRowSelected,
  rowClassName,
  rowStyle,
  sort,
  onSortChange,
  resizable,
  columnWidths,
  onColumnWidthsChange,
  hiddenColumns,
  onHiddenColumnsChange,
  onColumnsReset,
  mobileColumnsMenu = true,
  stickyHeader,
  stickyHeaderTop,
  className,
  labels: labelsProp,
}: ResponsiveListProps<T>) {
  const { Link, navigate } = useUi()
  const labels = useLabels(labelsProp)
  // Redimensión de columnas (asa + ancho en vivo del arrastre): el hook se
  // exporta aparte para tablas hechas a mano (ver useColumnResize).
  const { widthOf, resizeHandle } = useColumnResize({ columnWidths, onColumnWidthsChange })
  // Handlers de la fila-enlace. El <Link> de la columna `primary` ya cubre el
  // teclado y el menú contextual; esto es para que el resto de la fila (que no
  // puede ser un <a>: no se puede envolver un <tr>, y un overlay absoluto
  // taparía los botones de acción) se comporte igual con el ratón.
  function rowNavProps(href: string | undefined) {
    if (!href) return {}
    return {
      onClick: (e: React.MouseEvent) => {
        // El <Link> de `primary` ya navegó; sin esto iríamos dos veces.
        if (e.defaultPrevented) return
        // Misma convención que un enlace del navegador.
        if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(href, '_blank', 'noopener')
        else navigate(href)
      },
      onAuxClick: (e: React.MouseEvent) => {
        if (e.button !== 1) return
        e.preventDefault()
        window.open(href, '_blank', 'noopener')
      },
    }
  }
  // `primary` pasa a ser un enlace real cuando la fila navega. Sin estilo de
  // enlace a propósito: muchas celdas primary llevan badges dentro y subrayarlo
  // todo quedaba raro — la señal de "pinchable" la da el hover de la fila.
  function renderCell(col: ResponsiveColumn<T>, row: T, href: string | undefined) {
    if (!col.primary || col.noRowLink || !href) return col.cell(row)
    return (
      <Link href={href} className="min-w-0 rounded-sm" onClick={(e) => e.stopPropagation()}>
        {col.cell(row)}
      </Link>
    )
  }

  // Título de la tarjeta móvil. Con `rowHref` el <Link> ES el título (sin un
  // <div> envolvente): el nombre-enlace medía 23 px de alto en táctil
  // y la única forma de darle los
  // 44 px sin estirar la tarjeta es TOUCH_TEXT_LINK, cuyo padding recortaría
  // un `truncate` padre — así que el truncado va en el propio <a>, que es
  // `block` y no inline como en la tabla. Con `noRowLink` la celda trae sus
  // propios enlaces y les toca a ellos llevar TOUCH_TEXT_LINK, por lo que el
  // envoltorio tampoco puede recortar: `min-w-0` (el título largo salta de
  // línea en vez de cortarse sin puntos suspensivos, que es lo que hacía un
  // <a> `block` dentro de `truncate`).
  function renderCardTitle(col: ResponsiveColumn<T>, row: T, href: string | undefined) {
    if (!href || col.noRowLink) {
      return (
        <div className={cn(col.noRowLink && href ? 'min-w-0' : 'truncate', 'font-medium')}>
          {col.cell(row)}
        </div>
      )
    }
    return (
      <Link
        href={href}
        className={cn('block min-w-0 truncate rounded-sm font-medium', TOUCH_TEXT_LINK)}
        onClick={(e) => e.stopPropagation()}
      >
        {col.cell(row)}
      </Link>
    )
  }

  // Cabecera ordenable: el texto + icono dentro de un <button> sin estilo de
  // botón. `-mx-4 px-4` = TABLE_CELL_X, para que el padding lateral de la celda
  // también sea zona de click. `inline-flex` (y no `flex`) para respetar el
  // `text-right` de las columnas numéricas.
  function renderHead(col: ResponsiveColumn<T>) {
    if (!col.sortable || !onSortChange) return col.header
    const active = sort?.key === col.key
    const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        className="-mx-4 inline-flex h-10 cursor-pointer items-center gap-1 rounded-sm px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() =>
          onSortChange({ key: col.key, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })
        }
      >
        {col.header}
        <Icon
          aria-hidden
          className={cn(
            'size-3.5 shrink-0',
            !active && 'opacity-0 group-hover:opacity-60 group-focus-within:opacity-60',
          )}
        />
      </button>
    )
  }
  function ariaSort(col: ResponsiveColumn<T>): React.AriaAttributes['aria-sort'] {
    if (!col.sortable || !onSortChange) return undefined
    if (sort?.key !== col.key) return 'none'
    return sort.dir === 'asc' ? 'ascending' : 'descending'
  }

  // Ancho a aplicar en el <colgroup>: ver `resolveColumnWidth`.
  function colWidth(col: ResponsiveColumn<T>): number | undefined {
    return resolveColumnWidth(col, widthOf(col.key))
  }

  const visibleColumns = visibleColumnsOf(columns, hiddenColumns)
  const mobileColumns = visibleColumns.filter((c) => !c.hideOnMobile)
  const primary = mobileColumns.find((c) => c.primary)
  // TODAS las columnas `action` van al slot superior derecho: con find() solo
  // sobrevivía la primera y el resto desaparecía en móvil (p.ej. el botón de
  // borrar línea de ReceiveDeliveryPage era inaccesible en teléfono).
  const actions = mobileColumns.filter((c) => c.action)
  const body = mobileColumns.filter((c) => !c.primary && !c.action)
  // Sticky: con el border-collapse por defecto los bordes pertenecen al <tr>
  // y NO viajan con las celdas sticky (queda una línea huérfana + un hueco de
  // 1-2px por el que asoma el contenido al scrollear). En modo sticky la tabla
  // pasa a border-separate y los separadores se pintan en las celdas (th/td),
  // que sí se mueven con el sticky.
  const stickyHeadClass = stickyHeader ? 'sticky z-10 border-b bg-background' : undefined
  // top -1px: Chrome redondea posiciones fraccionales al scrollear y deja un
  // hilo de 1px entre el borde del contenedor y la celda sticky por el que
  // asoma el contenido; solapar 1px hacia arriba lo tapa (el contenedor clipa
  // ese píxel, no se pierde nada visible).
  const stickyHeadStyle = stickyHeader ? { top: (stickyHeaderTop ?? 0) - 1 } : undefined
  // Con anchos fijos las celdas no pueden envolver: recortan con elipsis.
  const fixedCellClass = resizable ? 'overflow-hidden text-ellipsis' : undefined
  const lastVisibleKey = visibleColumns[visibleColumns.length - 1]?.key
  // El menú solo se pinta si la lista trae los dos callbacks (opt-in): sin
  // ellos el markup queda exactamente como antes.
  const columnsMenu =
    onHiddenColumnsChange && onColumnsReset ? (
      <ColumnsMenu
        columns={columns}
        hidden={hiddenColumns ?? []}
        onHiddenChange={onHiddenColumnsChange}
        onReset={onColumnsReset}
        labels={labelsProp}
      />
    ) : null
  // La celda del menú va `sticky right-0`: con `resizable` la tabla puede
  // scrollear a lo ancho y el botón se perdería fuera de pantalla. `z-20` para
  // quedar por encima del resto de la cabecera sticky (z-10), y fondo propio
  // opaco para que el contenido pase por debajo sin transparentarse. El `top`
  // sale del sticky de cabecera cuando lo hay: la celda se fija en los dos ejes.
  const menuHeadStyle: React.CSSProperties = { ...stickyHeadStyle, right: 0 }

  return (
    // @container + @3xl (48rem, el mismo valor que `md`) en vez de `md:`: el
    // breakpoint miraba el VIEWPORT, pero el hueco real es el viewport menos el
    // sidebar (~300 px) menos el padding. A 1024 px de viewport la tabla solo
    // tenía 703 px, se pasaba de largo y lo que caía por el borde derecho era
    // siempre la columna de acciones, tras un scroll horizontal que nadie ve.
    // Midiendo el contenedor, una lista metida en una tarjeta estrecha también
    // acierta — el caso de las sedes en Ajustes → Taller, con 302 px.
    <div className={cn('@container', className)}>
      {/* Desktop: table */}
      <div className="hidden @3xl:block">
        <Table
          containerClassName={stickyHeader ? 'overflow-visible' : undefined}
          className={cn(
            stickyHeader &&
              'border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0',
            resizable && 'table-fixed',
          )}
        >
          {resizable && (
            <colgroup>
              {leading && <col style={{ width: 40 }} />}
              {/* Regla para quien defina `columns`: como mucho UNA columna (lo
                  suyo es que sea la `primary`) debe quedarse sin `width` — esa
                  es la que absorbe el espacio sobrante de table-fixed. Pon
                  `width` al resto de columnas de datos; las `action` sin
                  cabecera (icono suelto) no lo necesitan, ya caen a
                  DEFAULT_ACTION_COLUMN_WIDTH — pero una `action` CON cabecera
                  (botón con texto, p.ej. «Presupuesto de venta») SÍ necesita
                  su `width` explícito o se recorta. */}
              {visibleColumns.map((col) => {
                const width = colWidth(col)
                return <col key={col.key} style={width ? { width } : undefined} />
              })}
              {columnsMenu && <col style={{ width: 44 }} />}
            </colgroup>
          )}
          <TableHeader className={stickyHeader ? '[&_tr]:border-b-0' : undefined}>
            <TableRow className={stickyHeader ? 'hover:bg-transparent' : undefined}>
              {leading && (
                <TableHead className={cn('w-10', stickyHeadClass)} style={stickyHeadStyle} />
              )}
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    // `relative` ANTES de `sticky` (stickyHeadClass): con las
                    // dos, tailwind-merge se queda con la última y sticky es
                    // también contenedor del asa absoluta.
                    resizable && 'relative',
                    fixedCellClass,
                    col.sortable && onSortChange && 'group',
                    col.headClassName,
                    stickyHeadClass,
                  )}
                  style={stickyHeadStyle}
                  aria-sort={ariaSort(col)}
                >
                  {renderHead(col)}
                  {resizable && col.key !== lastVisibleKey && resizeHandle(col.key)}
                </TableHead>
              ))}
              {columnsMenu && (
                <TableHead
                  className={cn(
                    'sticky z-20 w-11 bg-background p-0 text-center',
                    stickyHeader && 'border-b',
                  )}
                  style={menuHeadStyle}
                >
                  {/* Nombre accesible de la columna: el botón es un icono. */}
                  <span className="sr-only">{labels.columnsMenu}</span>
                  {columnsMenu}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const href = rowHref?.(row)
              const style = rowStyle?.(row)
              return (
                <TableRow
                  key={rowKey(row)}
                  className={cn(
                    (href || onRowClick) &&
                      (style ? 'cursor-pointer' : 'cursor-pointer hover:bg-muted/50'),
                    style && TINTED_ROW_CLASS,
                    rowClassName?.(row),
                  )}
                  style={style}
                  data-state={isRowSelected?.(row) ? 'selected' : undefined}
                  {...rowHoverProps?.(row)}
                  // El camino de role="button" es solo para `onRowClick`: con
                  // `rowHref` el elemento accesible es el <Link> de `primary` y
                  // el <tr> sigue siendo una fila de tabla de verdad.
                  {...(href
                    ? rowNavProps(href)
                    : { onClick: onRowClick ? () => onRowClick(row) : undefined })}
                  role={!href && onRowClick ? 'button' : undefined}
                  tabIndex={!href && onRowClick ? 0 : undefined}
                  onKeyDown={
                    !href && onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                >
                  {leading && (
                    // onAuxClick además de onClick: sin él, el click de rueda
                    // sobre el checkbox de selección abría el detalle en una
                    // pestaña nueva.
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      onAuxClick={(e) => e.stopPropagation()}
                    >
                      {leading(row)}
                    </TableCell>
                  )}
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        // Las `action` quedan fuera del recorte con elipsis: son
                        // botones (con o sin texto), no texto que deba acortarse.
                        // Sin esto un botón «Presupuesto de venta» dentro de una
                        // columna estrecha se recortaba a media palabra.
                        fixedCellClass && !col.action && fixedCellClass,
                        col.cellClassName,
                      )}
                    >
                      {renderCell(col, row, href)}
                    </TableCell>
                  ))}
                  {/* Celda vacía de la columna del menú: no es sticky a
                      propósito — un fondo opaco fijo aquí se comería el hover
                      de la fila y los tintes de `rowStyle`. Como está vacía, no
                      hay nada que proteger del scroll horizontal. */}
                  {columnsMenu && <TableCell className="p-0" />}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-2 @3xl:hidden">
        {/* Sin cabecera de tabla en móvil: el menú de columnas va encima de
            las tarjetas, a la derecha, salvo `mobileColumnsMenu={false}`
            (listas con `ListFooter`, que ya lo pinta). */}
        {mobileColumnsMenu && columnsMenu && (
          <div className="flex justify-end" data-list-columns-menu>
            {columnsMenu}
          </div>
        )}
        {data.map((row) => {
          const href = rowHref?.(row)
          const style = rowStyle?.(row)
          return (
            <div
              key={rowKey(row)}
              className={cn(
                // `bg-card` en su posición de siempre: sin `rowStyle` la cadena
                // de clases queda idéntica a la de antes de existir esta prop.
                'rounded-xl',
                style ? TINTED_ROW_CLASS : 'bg-card',
                'p-4 text-sm ring-1 ring-foreground/10',
                (href || onRowClick) && 'cursor-pointer active:bg-muted/50',
                isRowSelected?.(row) && 'ring-primary',
                rowClassName?.(row),
              )}
              style={style}
              {...rowHoverProps?.(row)}
              {...(href
                ? rowNavProps(href)
                : { onClick: onRowClick ? () => onRowClick(row) : undefined })}
              role={!href && onRowClick ? 'button' : undefined}
              tabIndex={!href && onRowClick ? 0 : undefined}
              onKeyDown={
                !href && onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
            >
              {/* Cabecera de la card: título + slot de acciones.
                  `flex-wrap` + suelo de ancho para el título: el slot de
                  acciones se pensó para algo compacto (badge, menú de fila),
                  pero varias listas meten ahí 2-3 botones CON TEXTO (su `width`
                  es de la tabla de escritorio, que es `table-fixed`). Al ser
                  `shrink-0` no cedían y el título se quedaba en una tira de un
                  carácter por línea (/sales/used en un móvil real, 18/09).
                  Por qué así y no de otra forma:
                  - El título lleva `flex-1` (base 0), así que por largo que sea
                    NUNCA fuerza el salto: una card con badge o menú de fila
                    sigue pintándose en una sola línea, exactamente igual que
                    antes. Es el requisito de no tocar los ~40 listados.
                  - `min-w-32` (128px ≈ 18 caracteres a `text-sm`) es el suelo
                    que decide el salto: el algoritmo de flex-wrap acota el
                    tamaño hipotético del título por su `min-width`, así que el
                    bloque de acciones baja de línea justo cuando no caben los
                    dos. En su propia línea ocupa el ancho entero y no aplasta
                    nada.
                  - Descartado un corte `@…` por tamaño de contenedor: el que
                    manda aquí no es el ancho de la lista sino cuánto ocupan
                    unas acciones que el componente no conoce; flex-wrap lo
                    decide midiendo el contenido real, sin número mágico.
                  `data-list-card-title`: gancho estable para tests e2e que
                  vigilen justo este aplastamiento. */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-32 flex-1 items-center gap-2" data-list-card-title>
                  {leading && (
                    <span
                      onClick={(e) => e.stopPropagation()}
                      onAuxClick={(e) => e.stopPropagation()}
                    >
                      {leading(row)}
                    </span>
                  )}
                  {primary && renderCardTitle(primary, row, href)}
                </div>
                {actions.length > 0 && (
                  // `shrink-0` se queda: dentro de SU línea las acciones no se
                  // encogen (un botón a medio recortar no sirve). Lo que evita
                  // el aplastamiento es el salto de línea de arriba. `flex-wrap`
                  // por si en su propia línea siguen sin caber (3 botones con
                  // texto a 390px): envuelven en dos filas en vez de salirse, y
                  // `max-w-full` acota el bloque al ancho de la card para que
                  // ese `shrink-0` no lo deje asomar por el borde.
                  <div className="flex max-w-full shrink-0 flex-wrap items-center gap-1">
                    {actions.map((col) => (
                      <span key={col.key}>{col.cell(row)}</span>
                    ))}
                  </div>
                )}
              </div>
              {body.length > 0 && (
                <dl className="mt-2 space-y-1">
                  {body
                    .filter((col) => !col.mobileHideWhen?.(row))
                    .map((col) => (
                      <div
                        key={col.key}
                        className={cn(
                          col.mobileFullWidth ? 'space-y-1' : 'flex justify-between gap-3',
                        )}
                      >
                        {!col.mobileHideLabel && col.header && (
                          <dt
                            className={cn(
                              'text-muted-foreground',
                              col.mobileFullWidth
                                ? 'text-xs font-medium uppercase tracking-wide'
                                : 'shrink-0',
                            )}
                          >
                            {col.header}
                          </dt>
                        )}
                        {/* min-w-0 + break-words: valores largos sin espacios (emails,
                          IBANs) rompen línea en vez de ensanchar la card a >390px. */}
                        <dd
                          className={cn(
                            'min-w-0 break-words',
                            col.mobileFullWidth ? 'text-left' : 'text-right',
                          )}
                        >
                          {col.cell(row)}
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

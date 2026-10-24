import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '../lib/cn'
import { ColumnsMenu } from './columns-menu'
import { ListCompactProvider } from './listCompact'
import { useColumnResize } from './useColumnResize'
import { TINTED_ROW_CLASS } from './rowTone'
import { visibleColumnsOf } from './columnWidth'
import { nodeText } from './nodeText'
import { moveColumn, orderColumns } from './columnOrder'
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
  // Ancho (px) de la columna en `resizable` mientras el usuario no la haya
  // arrastrado (`columnWidths` siempre gana). Sin `width`: las `action` SIN
  // cabecera (icono suelto) caen a `DEFAULT_ACTION_COLUMN_WIDTH` (56) y el
  // resto a `DEFAULT_COLUMN_WIDTH` (160). En la de relleno (`fill`) es su
  // ancho BASE: el que tiene si la tabla no cabe.
  width?: number
  // Columna de relleno de `resizable` (v0.9.0), UNA por tabla (si hay varias
  // marcadas, la primera): si las columnas no llenan el contenedor, ella se
  // estira para ocupar el hueco (solo crece, nunca baja de su ancho base). Sin
  // ninguna marcada no hay relleno: la tabla sigue al 100 % y el sobrante se
  // reparte en proporción entre todas (v0.9.6). Con ancho guardado, ese ancho
  // es su TOPE (v0.9.8): como mucho eso, y si no cabe encoge. No se elige
  // sola: márcala en la columna de texto principal (descripción, cliente…),
  // nunca en un Nº.
  fill?: boolean
  // @deprecated v0.9.0: alias de `fill` (era la «columna flexible» de v0.5.0).
  flex?: boolean
  // Suelo (px) de la columna en `resizable` (por defecto 64, o su propio
  // ancho si es menor): ni el arrastre ni un ancho guardado en `columnWidths`
  // la pintan por debajo (una fecha guardada a 105 px que cortaba «19/10/2…»).
  minWidth?: number
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
  // `onColumnWidthsChange` recibe el mapa completo al soltar (con el suelo de
  // la columna, ver `minWidth`) y sin esa clave al hacer doble click en el
  // asa. Modelo proporcional (v0.9.9, ver `useColumnResize`): agrandar una
  // columna sube su base y las demás encogen en proporción (hasta su suelo en
  // pantalla); el último borde controla la última columna. La tabla ocupa el
  // contenedor; lo que sobre lo ocupa la columna `fill` y, si no hay, se
  // reparte en proporción entre todas; si falta, encogen todas hasta su suelo
  // y solo por debajo del mínimo de serie hay scroll horizontal.
  resizable?: boolean
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  // Columnas ocultas por el usuario (opt-in): se filtran en tabla y tarjetas.
  // La columna `primary` nunca se oculta.
  hiddenColumns?: string[]
  // Menú de columnas incrustado (opt-in): con AMBOS callbacks, la tabla de
  // escritorio superpone el botón del `ColumnsMenu` en el borde derecho de la
  // cabecera (desde v0.6.0 NO es una columna: no ocupa ancho ni pinta celdas
  // en el cuerpo). En móvil no hay cabecera: el menú va encima de las
  // tarjetas (ver `mobileColumnsMenu`).
  onHiddenColumnsChange?: (hidden: string[]) => void
  onColumnsReset?: () => void
  // En móvil (cards) pinta el menú de columnas encima de las tarjetas,
  // alineado a la derecha. Requiere los dos callbacks de arriba. Por defecto
  // SÍ (con los callbacks); pasa `false` cuando la lista va con `ListFooter`,
  // que ya pinta el menú en móvil (`useListView` paginado lo hace solo en
  // `listProps`).
  mobileColumnsMenu?: boolean
  // Modo compacto (opt-in): cada fila en una línea. En escritorio las celdas
  // (salvo `action`) no envuelven y recortan con elipsis, y las cabeceras no
  // envuelven; en móvil cada valor de la tarjeta va en una línea (`truncate`)
  // y las acciones no saltan de fila. Gana a un `cellClassName`/`headClassName`
  // con `whitespace-normal`. Marca `data-compact` en la tabla y en cada
  // tarjeta, y las celdas leen el modo con `useListCompact()`.
  compact?: boolean
  // Con este callback (y el menú de columnas activo) el `ColumnsMenu` pinta la
  // casilla «Modo compacto».
  onCompactChange?: (compact: boolean) => void
  // Orden de columnas del usuario (opt-in). `columnOrder` (claves; `[]` = el
  // de `columns`) se aplica a tabla, <colgroup> y <dl> de la tarjeta móvil; el
  // título de la tarjeta sigue siendo la `primary`. Las `action` (y la columna
  // (y el botón del menú) no se mueven. Con `onColumnOrderChange`, en escritorio se
  // arrastra la cabecera para mover la columna (HTML5 drag and drop) y el menú
  // de columnas ofrece «Subir»/«Bajar» (la vía de teclado). El callback recibe
  // todas las claves de `columns` en el orden nuevo.
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  // Filas por página (opt-in, v0.7.0): con `onPageSizeChange` (y el menú de
  // columnas activo) el `ColumnsMenu` pinta el submenú «Filas por página».
  // `useListView` paginado lo cablea en `listProps`.
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  // Pins the desktop table header (thead) at the top while the list scrolls. Intended
  // for a list rendered inside its own vertical scroll container (`overflow-y-auto`),
  // so the header sticks to that container's top. `stickyHeaderTop` overrides the CSS
  // `top` (px) if the header must pin below something.
  stickyHeader?: boolean
  stickyHeaderTop?: number
  // v0.8.0: con `false` las preferencias del listado aún no son las
  // definitivas (`useListView` lo cablea en `listProps`): en vez de pintar la
  // tabla con anchos/orden/columnas por defecto que luego saltarían, se pinta
  // un esqueleto (`aria-busy`). Por defecto, `true`.
  ready?: boolean
  className?: string
  // Textos propios (menú de columnas); ganan al `UiProvider`.
  labels?: Partial<Labels>
}

// Fondo de la cabecera (v0.9.0). El botón del menú de columnas iba con
// `bg-background` fijo y salía de otro color en cuanto la cabecera no era el
// fondo de la página (una tarjeta `bg-card`, una cabecera teñida, el modo
// oscuro de un panel…). Ahora:
// - El botón NO tiene color propio: `bg-inherit` desde su <th>, y <th>, <tr>
//   y <thead> también heredan (`HEAD_INHERIT`). El fondo que pinta es el
//   real de la fila de cabecera: el que el consumidor ponga en `headClassName`,
//   en el <tr>/<thead> o en la propia lista; si la cabecera es transparente
//   sobre la página, el botón también (sin caja de color). Va también sobre
//   un `:hover` del <tr> de cabecera.
// - La cabecera FIJA (`stickyHeader`) sí necesita fondo opaco (el contenido
//   pasa por debajo al hacer scroll): `HEAD_BG`, una variable con respaldo:
//   1. `--list-head-bg`, si el consumidor la fija (en el `className` de la
//      lista o en un ancestro), p.ej. `[--list-head-bg:var(--color-muted)]`;
//   2. `--list-auto-head-bg`, que la lista pone a `--color-card` cuando está
//      dentro de un `.bg-card` (`AUTO_HEAD_BG`, en su raíz);
//   3. `--color-background`, el de siempre (sigue al modo oscuro).
//   El botón la hereda de su <th> como cualquier otro fondo.
// Un `headClassName` con su propio `bg-*` gana a los dos (va después en `cn`).
const HEAD_INHERIT = 'bg-inherit'
const HEAD_BG =
  'bg-[color:var(--list-head-bg,var(--list-auto-head-bg,var(--color-background)))]'
const AUTO_HEAD_BG = '[.bg-card_&]:[--list-auto-head-bg:var(--color-card)]'

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
  compact = false,
  onCompactChange,
  columnOrder,
  onColumnOrderChange,
  pageSize,
  onPageSizeChange,
  stickyHeader,
  stickyHeaderTop,
  ready = true,
  className,
  labels: labelsProp,
}: ResponsiveListProps<T>) {
  const { Link, navigate } = useUi()
  const labels = useLabels(labelsProp)
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

  const orderedColumns = orderColumns(columns, columnOrder)
  const visibleColumns = visibleColumnsOf(orderedColumns, hiddenColumns)
  // Redimensión de columnas (asa + ancho en vivo del arrastre + relleno): el
  // hook se exporta aparte para tablas hechas a mano (ver useColumnResize).
  // Recibe las columnas VISIBLES en su orden: la suma y el relleno salen de ellas.
  // Ancho del contenedor de la <table> (v0.9.8): con él las columnas encogen
  // en proporción cuando no caben y el arrastre sabe la escala (v0.9.9). Se
  // mide el padre de la tabla (su bloque contenedor) con un ResizeObserver;
  // sin él o en jsdom (0), cada <col> lleva su base y, si no caben, scroll.
  const [containerWidth, setContainerWidth] = React.useState(0)
  const observerRef = React.useRef<ResizeObserver | null>(null)
  const measureContainer = React.useCallback((table: HTMLTableElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    const box = table?.parentElement
    if (!box) return
    const measure = () => {
      // Por lo bajo (clientWidth es entero y la caja puede tener decimales): un
      // px de más haría que la tabla desbordara y saliera scroll lateral.
      const w = Math.floor(Math.min(box.clientWidth || Infinity, box.getBoundingClientRect().width))
      setContainerWidth(Number.isFinite(w) && w > 0 ? w : 0)
    }
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure)
      ro.observe(box)
      observerRef.current = ro
    }
  }, [])
  const { colWidth, tableStyle, totalWidth, resizeHandle } = useColumnResize({
    columnWidths,
    onColumnWidthsChange,
    columns: visibleColumns,
    containerWidth,
    leadingWidth: leading ? 40 : 0,
    labels: labelsProp,
  })
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
  const stickyHeadClass = stickyHeader ? cn('sticky z-10 border-b', HEAD_BG) : undefined
  // top -1px: Chrome redondea posiciones fraccionales al scrollear y deja un
  // hilo de 1px entre el borde del contenedor y la celda sticky por el que
  // asoma el contenido; solapar 1px hacia arriba lo tapa (el contenedor clipa
  // ese píxel, no se pierde nada visible).
  const stickyHeadStyle = stickyHeader ? { top: (stickyHeaderTop ?? 0) - 1 } : undefined
  // Con anchos fijos las celdas no pueden envolver: recortan con elipsis.
  const fixedCellClass = resizable ? 'overflow-hidden text-ellipsis' : undefined
  const lastVisibleKey = visibleColumns[visibleColumns.length - 1]?.key
  /** Nombre de una columna para el `aria-label` de su asa. */
  const columnName = (c: ResponsiveColumn<T>) =>
    nodeText(c.header) || (c.action ? labels.actionsColumn : c.key)
  // El menú solo se pinta si la lista trae los dos callbacks (opt-in): sin
  // ellos el markup queda exactamente como antes.
  const columnsMenu =
    onHiddenColumnsChange && onColumnsReset ? (
      <ColumnsMenu
        columns={columns}
        hidden={hiddenColumns ?? []}
        onHiddenChange={onHiddenColumnsChange}
        onReset={onColumnsReset}
        compact={compact}
        onCompactChange={onCompactChange}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        labels={labelsProp}
      />
    ) : null
  // Compacto: una línea por celda. Va DESPUÉS de las clases del consumidor en
  // `cn()` (tailwind-merge) para ganar a un `whitespace-normal` suyo.
  const compactCellClass = compact ? 'whitespace-nowrap overflow-hidden text-ellipsis' : undefined
  const compactHeadClass = compact ? 'whitespace-nowrap' : undefined
  // Botón del menú de columnas (v0.6.0): NO es una columna —una columna de
  // 44 px le quitaba ese ancho a las de verdad y en tablas justas cortaba los
  // estados—. Siempre a la vista aunque la tabla scrollee a lo ancho (LIST-3):
  // - Sin `stickyHeader` va DENTRO de la última cabecera visible (así el Tab
  //   llega a él justo después de las cabeceras ordenables) pero posicionado
  //   `absolute`: la <th> y el contenedor de scroll de la tabla se quedan SIN
  //   posicionar, así que su bloque contenedor es el envoltorio `relative` de
  //   fuera del scroll: queda en la esquina superior derecha VISIBLE aunque la
  //   tabla scrollee a lo ancho, y el `overflow` del contenedor (y el
  //   `overflow-hidden` de `resizable`) no lo recorta.
  // - Con `stickyHeader` (v0.9.7) el scroll es del consumidor (p. ej. un visor
  //   con `overflow-auto` en los dos ejes) y dentro de la última <th> (sticky,
  //   o sea posicionada, y con `overflow-hidden`) el botón se iba con ella por
  //   la derecha. Ahora va en un ancla `sticky` (arriba y a la derecha) JUSTO
  //   ANTES de la <table>, dentro del envoltorio, que mide lo mismo que la
  //   tabla (`min-width` = la suma de anchos con `resizable`, `min-w-fit` sin
  //   él): así el ancla puede pegarse al borde derecho del visor en todo el
  //   ancho de la tabla. Alto 0 (no empuja la tabla); el botón cuelga de ella
  //   con fondo opaco de cabecera fija. En el Tab va justo ANTES de las
  //   cabeceras (no puede ir detrás en el DOM sin quedar tras todas las filas).
  // La última cabecera reserva su ancho con `pr-10` (solo la <th>, nunca las
  // celdas) para que el botón no tape el texto ni la flecha de orden cuando la
  // tabla cabe o está al final del scroll; una `action` sin cabecera no tiene
  // nada que tapar y no lo lleva. No es zona de arrastre ni de soltar
  // (`data-list-columns-menu-head`).
  const menuInHead = !!columnsMenu
  const menuOutsideScroll = menuInHead && !stickyHeader
  const menuSticky = menuInHead && !!stickyHeader
  const lastVisibleCol = visibleColumns[visibleColumns.length - 1]
  const lastHeadPad = menuInHead && !!lastVisibleCol && !(lastVisibleCol.action && !lastVisibleCol.header)

  // Arrastre de cabeceras (HTML5 drag and drop nativo, sin dependencias). Solo
  // las columnas no-`action` se arrastran y reciben. La columna cae DETRÁS del
  // destino si venía de su izquierda y DELANTE si venía de su derecha (lo que
  // marca el indicador), sin medir geometría.
  // - Un clic sin mover no es un arrastre: el botón de ordenar sigue ordenando
  //   (el navegador no dispara `click` tras un `dragstart`).
  // - El asa de redimensión NO arrastra: `pointerdown` sobre ella marca
  //   `resizingRef` y el `dragstart` siguiente se cancela.
  // - El foco no se toca: `draggable` va en el <th> (no enfocable), el botón de
  //   ordenar de dentro sigue siendo el que recibe Tab.
  const reorderable = !!onColumnOrderChange
  const [dragKey, setDragKey] = React.useState<string | null>(null)
  const [overKey, setOverKey] = React.useState<string | null>(null)
  const resizingRef = React.useRef(false)
  const visibleIndex = (key: string | null) =>
    key == null ? -1 : visibleColumns.findIndex((c) => c.key === key)
  const dropSide = (key: string): 'before' | 'after' | null => {
    if (!dragKey || overKey !== key || dragKey === key) return null
    return visibleIndex(dragKey) < visibleIndex(key) ? 'after' : 'before'
  }
  function endDrag() {
    setDragKey(null)
    setOverKey(null)
  }
  function headDragProps(col: ResponsiveColumn<T>): React.ThHTMLAttributes<HTMLTableCellElement> {
    if (!reorderable || col.action) return {}
    return {
      draggable: true,
      onPointerDown: (e) => {
        // Ni el asa ni el botón del menú de columnas arrastran la cabecera.
        resizingRef.current = !!(e.target as Element).closest?.(
          '[data-column-resize-handle],[data-list-columns-menu-head]',
        )
      },
      onDragStart: (e) => {
        if (resizingRef.current) {
          resizingRef.current = false
          e.preventDefault()
          return
        }
        e.dataTransfer.effectAllowed = 'move'
        // Firefox no arranca el arrastre sin datos.
        e.dataTransfer.setData('text/plain', col.key)
        setDragKey(col.key)
      },
      onDragOver: (e) => {
        if (!dragKey) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overKey !== col.key) setOverKey(col.key)
      },
      onDragLeave: (e) => {
        // Solo al salir del <th>, no al pasar entre sus hijos.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        if (overKey === col.key) setOverKey(null)
      },
      onDrop: (e) => {
        if (!dragKey) return
        e.preventDefault()
        const next = moveColumn(columns, columnOrder, dragKey, col.key)
        endDrag()
        if (next) onColumnOrderChange?.(next)
      },
      onDragEnd: endDrag,
    }
  }

  if (!ready) {
    return (
      <div
        className={cn('flex flex-col gap-2 py-1', className)}
        aria-busy="true"
        data-list-pending=""
      >
        <span className="sr-only">{labels.loading}</span>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} aria-hidden="true" className="h-9 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    )
  }

  return (
    // @container + @3xl (48rem, el mismo valor que `md`) en vez de `md:`: el
    // breakpoint miraba el VIEWPORT, pero el hueco real es el viewport menos el
    // sidebar (~300 px) menos el padding. A 1024 px de viewport la tabla solo
    // tenía 703 px, se pasaba de largo y lo que caía por el borde derecho era
    // siempre la columna de acciones, tras un scroll horizontal que nadie ve.
    // Midiendo el contenedor, una lista metida en una tarjeta estrecha también
    // acierta — el caso de las sedes en Ajustes → Taller, con 302 px.
    <ListCompactProvider value={compact}>
      <div className={cn('@container', AUTO_HEAD_BG, className)}>
        {/* Desktop: table */}
        <div
          className={cn(
            'hidden @3xl:block',
            menuOutsideScroll && 'relative',
            // Ancla del menú con cabecera fija (LIST-3): el envoltorio mide lo
            // que la tabla para que el ancla `sticky` recorra todo su ancho
            // (su mismo `min-width`, v0.9.9: el mínimo, no la suma de bases).
            menuSticky && 'relative',
            menuSticky && !resizable && 'min-w-fit',
          )}
          style={
            menuSticky && resizable && totalWidth != null
              ? { minWidth: tableStyle(leading ? 40 : 0)?.minWidth }
              : undefined
          }
        >
          {menuSticky && (
            <div
              data-list-columns-menu-head
              data-list-columns-menu-sticky=""
              className="sticky right-0 z-20 ml-auto h-0 w-0"
              style={stickyHeadStyle}
              onDragOver={(e) => e.stopPropagation()}
              onDrop={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  'absolute top-0 right-0 flex h-10 cursor-auto items-center px-1',
                  HEAD_BG,
                )}
              >
                {columnsMenu}
              </div>
            </div>
          )}
          <Table
            containerClassName={
              stickyHeader
                ? 'overflow-visible'
                : menuOutsideScroll
                  ? 'static overflow-x-auto'
                  : undefined
            }
            data-compact={compact ? '' : undefined}
            className={cn(
              stickyHeader &&
                'border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0',
              resizable && 'table-fixed',
            )}
            // Anchos (ver `useColumnResize`): SIEMPRE width 100% (v0.9.6:
            // nunca hueco a la derecha). Con relleno libre, su <col> va sin
            // ancho y table-fixed le da el sobrante; sin relleno, table-fixed
            // reparte el sobrante en proporción entre todas. Si no caben, cada
            // <col> lleva su ancho en pantalla (encogido hasta su suelo) y
            // solo por debajo del mínimo de serie (`min-width`) hay scroll.
            ref={resizable ? measureContainer : undefined}
            style={resizable ? tableStyle(leading ? 40 : 0) : undefined}
          >
            {resizable && (
              <colgroup>
                {leading && <col style={{ width: 40 }} />}
                {/* Todas las <col> llevan su ancho efectivo (guardado, `width` o
                    160 por defecto; las `action` sin cabecera, 56) salvo la de
                    relleno (`fill`), que va sin ancho y se queda el sobrante.
                    Una `action` CON cabecera (botón con texto, p.ej.
                    «Presupuesto de venta») necesita su `width` explícito si
                    160 no le basta. */}
                {visibleColumns.map((col) => {
                  const width = colWidth(col.key)
                  return <col key={col.key} style={width ? { width } : undefined} />
                })}
              </colgroup>
            )}
            <TableHeader className={cn(HEAD_INHERIT, stickyHeader && '[&_tr]:border-b-0')}>
              <TableRow className={cn(HEAD_INHERIT, stickyHeader && 'hover:bg-transparent')}>
                {leading && (
                  <TableHead className={cn('w-10', HEAD_INHERIT, stickyHeadClass)} style={stickyHeadStyle}>
                    <span className="sr-only">{labels.selectColumn}</span>
                  </TableHead>
                )}
                {visibleColumns.map((col, i) => {
                  const draggable = reorderable && !col.action
                  // Columna anterior: su asa tiene la otra mitad de la zona de
                  // agarre en el borde izquierdo de ESTA cabecera (ver
                  // `resizeHandle(key, 'start')`).
                  const prevKey = i > 0 ? visibleColumns[i - 1].key : undefined
                  const side = draggable ? dropSide(col.key) : null
                  const isLast = col.key === lastVisibleKey
                  // Sin `stickyHeader` la última <th> no puede ir posicionada
                  // (ver el botón del menú): su indicador de arrastre es una
                  // sombra interior en vez del <span> absoluto.
                  const staticHead = isLast && menuOutsideScroll
                  return (
                    <TableHead
                      key={col.key}
                      className={cn(
                        // `relative` ANTES de `sticky` (stickyHeadClass): con las
                        // dos, tailwind-merge se queda con la última y sticky es
                        // también contenedor del asa absoluta (y del indicador).
                        (resizable || draggable) && !staticHead && 'relative',
                        HEAD_INHERIT,
                        fixedCellClass,
                        col.sortable && onSortChange && 'group',
                        draggable && 'cursor-grab active:cursor-grabbing',
                        dragKey === col.key && 'opacity-50',
                        stickyHeadClass,
                        col.headClassName,
                        compactHeadClass,
                        isLast && lastHeadPad && 'pr-10',
                        staticHead &&
                          side &&
                          (side === 'before'
                            ? 'shadow-[inset_2px_0_0_var(--color-primary)]'
                            : 'shadow-[inset_-2px_0_0_var(--color-primary)]'),
                      )}
                      style={stickyHeadStyle}
                      aria-sort={ariaSort(col)}
                      data-column-key={draggable ? col.key : undefined}
                      data-column-width-key={resizable ? col.key : undefined}
                      data-dragging={dragKey === col.key ? '' : undefined}
                      data-drop={side ?? undefined}
                      {...headDragProps(col)}
                    >
                      {renderHead(col)}
                      {/* Dónde cae la columna arrastrada: una línea en el borde
                          izquierdo (delante) o derecho (detrás) del destino. */}
                      {side && !staticHead && (
                        <span
                          aria-hidden
                          data-column-drop-indicator={side}
                          className={cn(
                            'pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-primary',
                            side === 'before' ? 'left-0' : 'right-0',
                          )}
                        />
                      )}
                      {/* Columna de acciones sin cabecera visible: un <th> vacío no
                          tiene nombre accesible (axe empty-table-header). */}
                      {col.action && !col.header && (
                        <span className="sr-only">{labels.actionsColumn}</span>
                      )}
                      {resizable &&
                        !isLast &&
                        resizeHandle(
                          col.key,
                          'end',
                          // El último borde controla la última columna
                          // (v0.9.9): su asa lleva el nombre de esa.
                          columnName(i === visibleColumns.length - 2 ? visibleColumns[i + 1] : col),
                        )}
                      {isLast && menuOutsideScroll && (
                        <div
                          data-list-columns-menu-head
                          className={cn(
                            'absolute top-0 right-0 z-20 flex h-10 cursor-auto items-center px-1',
                            HEAD_INHERIT,
                          )}
                          // Ni origen ni destino de un arrastre de columnas.
                          onDragOver={(e) => e.stopPropagation()}
                          onDrop={(e) => e.stopPropagation()}
                        >
                          {columnsMenu}
                        </div>
                      )}
                      {/* Mitad derecha de la zona de agarre del borde anterior:
                          fallar el asa por 1 px ya no agarra (y mueve) esta
                          cabecera. Después del asa propia a propósito (quien
                          busque «el asa de la columna» encuentra antes la suya). */}
                      {resizable && prevKey && !staticHead && resizeHandle(prevKey, 'start')}
                      {/* En una <th> sin posicionar (`staticHead`) el `absolute`
                          del asa se iría al envoltorio, así que va dentro de un
                          ancla `relative` propia (v0.9.4): de ancho 0, pegada al
                          borde izquierdo (`-ml-4` = TABLE_CELL_X) y muy alta
                          con márgenes negativos (no ocupa sitio: su caja de
                          margen mide 0); el `overflow-hidden` de la <th> la
                          recorta a la altura de la cabecera. El botón del menú
                          no va dentro: sigue saliendo al envoltorio. */}
                      {resizable && prevKey && staticHead && (
                        <div
                          data-column-resize-anchor=""
                          className="relative -my-20 -ml-4 h-40 w-0"
                        >
                          {resizeHandle(prevKey, 'start')}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
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
                          !col.action && compactCellClass,
                        )}
                      >
                        {renderCell(col, row, href)}
                      </TableCell>
                    ))}
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
                data-compact={compact ? '' : undefined}
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
                    // Compacto: en una sola fila; lo que no quepa se recorta.
                    <div
                      className={cn(
                        'flex max-w-full shrink-0 items-center gap-1',
                        compact ? 'flex-nowrap overflow-hidden' : 'flex-wrap',
                      )}
                    >
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
                            IBANs) rompen línea en vez de ensanchar la card a >390px.
                            En compacto, una línea con elipsis (`truncate`). */}
                          <dd
                            className={cn(
                              'min-w-0',
                              compact ? 'truncate' : 'break-words',
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
    </ListCompactProvider>
  )
}

// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ResponsiveList,
  TOUCH_TEXT_LINK,
  type ListSort,
  type ResponsiveColumn,
} from './responsive-list'
import { useListCompact } from './listCompact'
import { UiProvider, type UiLinkProps } from '../context/UiProvider'

// Las capacidades nuevas de ResponsiveList (orden, anchos, fila coloreada,
// columnas ocultas) son opt-in: 56 listados las ignoran y deben seguir
// pintando exactamente lo mismo. Sin @testing-library: react-dom + act sobre
// jsdom bastan para lo que se comprueba aquí (markup y callbacks).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Row = { id: number; name: string; total: number }
const rows: Row[] = [
  { id: 1, name: 'Alfa', total: 10 },
  { id: 2, name: 'Beta', total: 20 },
]
const columns: ResponsiveColumn<Row>[] = [
  { key: 'name', header: 'Nombre', cell: (r) => r.name, primary: true },
  { key: 'total', header: 'Total', cell: (r) => String(r.total), sortable: true },
  { key: 'id', header: 'Id', cell: (r) => String(r.id) },
]

let container: HTMLDivElement
let root: Root

function render(ui: React.ReactElement) {
  act(() => {
    root.render(ui)
  })
}
function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}
const table = () => container.querySelector('table')!
const heads = () => Array.from(table().querySelectorAll('thead th'))
const cards = () =>
  Array.from(container.querySelectorAll('.\\@3xl\\:hidden > div:not([data-list-columns-menu])'))
const mobileMenu = () => container.querySelector('[data-list-columns-menu]')

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ResponsiveList (opt-in)', () => {
  it('sin las props nuevas no aparece nada nuevo en el markup', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} />)
    const base = container.innerHTML

    expect(table().querySelector('colgroup')).toBeNull()
    expect(table().className).not.toContain('table-fixed')
    expect(table().querySelector('thead button')).toBeNull()
    expect(container.querySelector('[aria-sort]')).toBeNull()
    expect(table().querySelector('tbody tr[style]')).toBeNull()
    // `sortable` en la columna sin `onSortChange` en la lista es inerte.
    expect(heads().map((th) => th.textContent)).toEqual(['Nombre', 'Total', 'Id'])
    for (const card of cards()) expect(card.className).toContain('bg-card')

    // Sin los DOS callbacks del menú no hay columna extra en la cabecera.
    expect(heads()).toHaveLength(3)

    // Valores "vacíos" de las props nuevas tampoco cambian un byte.
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        sort={null}
        hiddenColumns={[]}
        columnWidths={{}}
        rowStyle={() => undefined}
      />,
    )
    expect(container.innerHTML).toBe(base)

    // Un solo callback del menú tampoco lo enciende (hace falta la pareja).
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        onHiddenColumnsChange={() => {}}
      />,
    )
    expect(container.innerHTML).toBe(base)
  })

  it('v0.6.0: con los dos callbacks el botón del menú va en la cabecera, sin columna propia', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={['id']}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        mobileColumnsMenu={false}
      />,
    )
    // Cabecera: SOLO las visibles (id oculta); el botón no añade <th>.
    const th = heads()
    expect(th.map((h) => h.textContent)).toEqual(['Nombre', 'Total'])
    // El botón vive dentro de la ÚLTIMA cabecera visible, superpuesto.
    const menu = th[1].querySelector('[data-list-columns-menu-head]')!
    expect(menu).not.toBeNull()
    expect(menu.className).toContain('absolute')
    expect(menu.className).toContain('right-0')
    // v0.9.0: sin color propio, hereda el de su cabecera.
    expect(menu.className).toContain('bg-inherit')
    expect(menu.className).not.toContain('bg-background')
    expect(menu.querySelector('button')!.getAttribute('aria-label')).toBe('Columnas')
    expect(table().querySelectorAll('[data-list-columns-menu-head]')).toHaveLength(1)
    // Solo la última cabecera reserva el hueco del botón; ninguna celda.
    expect(th[1].className).toContain('pr-10')
    expect(th[0].className).not.toContain('pr-10')
    expect(table().querySelector('tbody td.pr-10')).toBeNull()
    // Sin stickyHeader: ni la <th> ni el contenedor de scroll van posicionados
    // (el botón se ancla al envoltorio `relative` de fuera del scroll).
    expect(th[1].className).not.toMatch(/\b(relative|sticky)\b/)
    const scroller = table().parentElement!
    expect(scroller.className).toContain('static')
    expect(scroller.className).not.toContain('relative')
    expect(scroller.parentElement!.className).toContain('relative')
    // No ordena ni se puede ocultar a sí mismo.
    expect(container.querySelectorAll('[aria-sort]')).toHaveLength(0)

    // Cuerpo: sin celda vacía extra por fila.
    for (const tr of Array.from(table().querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'))
      expect(cells.map((td) => td.textContent)).toEqual([expect.any(String), expect.any(String)])
      expect(cells.every((td) => td.textContent !== '')).toBe(true)
    }

    // Móvil (cards) con `mobileColumnsMenu={false}` (lista con ListFooter):
    // ni menú ni rastro de la columna.
    expect(mobileMenu()).toBeNull()
    for (const card of cards()) expect(card.querySelector('button')).toBeNull()
  })

  it('v0.6.0: con stickyHeader el botón va en la última <th> sticky', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        stickyHeader
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
      />,
    )
    const th = heads()
    expect(th).toHaveLength(3)
    const last = th[2]
    expect(last.className).toContain('sticky')
    expect(last.className).toContain('pr-10')
    expect(last.querySelector('[data-list-columns-menu-head] button')).not.toBeNull()
    expect(table().parentElement!.className).toContain('overflow-visible')
  })

  it('v0.6.0: una última columna `action` sin cabecera no lleva el padding extra', () => {
    render(
      <ResponsiveList
        columns={[...columns, { key: 'menu', cell: () => '⋯', action: true }]}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
      />,
    )
    const th = heads()
    expect(th).toHaveLength(4)
    expect(th[3].querySelector('[data-list-columns-menu-head]')).not.toBeNull()
    expect(th.some((h) => h.className.includes('pr-10'))).toBe(false)
  })

  it('v0.6.0: el botón del menú no entra en el colgroup y la última columna sigue sin asa', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        resizable
        columnWidths={{ total: 120 }}
        onColumnWidthsChange={() => {}}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
      />,
    )
    // Solo las 3 columnas de datos: ningún <col> de 44 px.
    const cols = Array.from(table().querySelectorAll('colgroup > col'))
    expect(cols).toHaveLength(3)
    expect(cols.some((c) => (c.getAttribute('style') ?? '').includes('44px'))).toBe(false)
    // Asa propia (borde derecho): todas menos la última.
    const handles = heads().map((th) => th.querySelector('[data-column-resize-handle=""]'))
    expect(handles.map(Boolean)).toEqual([true, true, false])
    // Con el menú fuera del scroll la última <th> va sin posicionar
    // (`staticHead`): no lleva la mitad derecha de la zona (iría al envoltorio).
    const starts = heads().map((th) => th.querySelector('[data-column-resize-handle="start"]'))
    expect(starts.map(Boolean)).toEqual([false, true, false])
    // Las mediciones solo cuentan las <th> de datos.
    expect(table().querySelectorAll('[data-column-width-key]')).toHaveLength(3)
    expect(
      table().querySelector('[data-list-columns-menu-head]')!.closest('[data-column-width-key]')!
        .getAttribute('data-column-width-key'),
    ).toBe('id')
  })

  it('la cabecera ordenable cicla asc → desc → asc y expone aria-sort', () => {
    const onSortChange = vi.fn<(next: ListSort) => void>()
    const ui = (sort: ListSort | null) => (
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        sort={sort}
        onSortChange={onSortChange}
      />
    )

    render(ui(null))
    const [nameTh, totalTh] = heads()
    expect(nameTh.hasAttribute('aria-sort')).toBe(false)
    expect(totalTh.getAttribute('aria-sort')).toBe('none')
    expect(nameTh.querySelector('button')).toBeNull()
    const button = totalTh.querySelector('button')!
    expect(button.getAttribute('type')).toBe('button')
    expect(button.textContent).toBe('Total')

    click(button)
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'total', dir: 'asc' })

    render(ui({ key: 'total', dir: 'asc' }))
    expect(heads()[1].getAttribute('aria-sort')).toBe('ascending')
    click(heads()[1].querySelector('button')!)
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'total', dir: 'desc' })

    render(ui({ key: 'total', dir: 'desc' }))
    expect(heads()[1].getAttribute('aria-sort')).toBe('descending')
    click(heads()[1].querySelector('button')!)
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'total', dir: 'asc' })

    // Ordenar por otra columna arranca en asc aunque la actual esté en desc.
    expect(onSortChange).toHaveBeenCalledTimes(3)
  })

  it('hiddenColumns oculta una columna normal pero nunca la primary', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={['id', 'name']}
      />,
    )
    expect(heads().map((th) => th.textContent)).toEqual(['Nombre', 'Total'])
    const firstRowCells = Array.from(table().querySelectorAll('tbody tr')[0].querySelectorAll('td'))
    expect(firstRowCells.map((td) => td.textContent)).toEqual(['Alfa', '10'])
    // En las cards: título (primary) presente, etiqueta "Id" ausente.
    const labels = Array.from(cards()[0].querySelectorAll('dt')).map((dt) => dt.textContent)
    expect(cards()[0].textContent).toContain('Alfa')
    expect(labels).toEqual(['Total'])
  })

  it('rowHoverProps engancha el hover a la fila ENTERA (tabla y card) sin tocar el enlace', () => {
    const enters: number[] = []
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/x/${r.id}`}
        rowHoverProps={(r) => ({ onMouseEnter: () => enters.push(r.id) })}
      />,
    )
    const row = table().querySelector('tbody tr')!
    act(() => {
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    act(() => {
      cards()[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(enters).toEqual([1, 2])
    // La fila sigue siendo enlace: el hover no mete nada dentro del <a>.
    expect(row.querySelector('a')?.getAttribute('href')).toBe('/x/1')
    expect(row.querySelector('a')?.querySelector('a, button')).toBeNull()
  })

  it('con rowHref el título de la card es el <Link> mismo, con área de toque de 44 px en táctil', () => {
    // El nombre-enlace medía 23 px de alto en táctil.
    // El <a> es el propio item flex (sin <div> envolvente que lo recorte) y
    // lleva el `truncate` que antes tenía el envoltorio.
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/x/${r.id}`}
      />,
    )
    const title = cards()[0].querySelector('[data-list-card-title]')!
    const link = title.querySelector('a')!
    expect(link.getAttribute('href')).toBe('/x/1')
    expect(link.parentElement).toBe(title)
    for (const cls of ['block', 'truncate', 'pointer-coarse:min-h-11', 'pointer-coarse:py-3']) {
      expect(link.className.split(' ')).toContain(cls)
    }
    // Sin `rowHref` el envoltorio de siempre, sin enlace.
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} />)
    const plain = cards()[0].querySelector('[data-list-card-title] > div')!
    expect(plain.className).toBe('truncate font-medium')
    expect(plain.querySelector('a')).toBeNull()
  })

  it('con noRowLink el envoltorio del título no recorta: los 44 px los pone el enlace de la celda', () => {
    const own: ResponsiveColumn<Row>[] = [
      {
        ...columns[0],
        noRowLink: true,
        cell: (r) => (
          <a href={`/own/${r.id}`} className={`block ${TOUCH_TEXT_LINK}`}>
            {r.name}
          </a>
        ),
      },
      ...columns.slice(1),
    ]
    render(
      <ResponsiveList
        columns={own}
        data={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/x/${r.id}`}
      />,
    )
    const wrapper = cards()[0].querySelector('[data-list-card-title] > div')!
    expect(wrapper.className).toBe('min-w-0 font-medium')
    // Un solo enlace, el de la celda: nada de anclas anidadas.
    expect(cards()[0].querySelectorAll('a')).toHaveLength(1)
    expect(cards()[0].querySelector('a')?.getAttribute('href')).toBe('/own/1')
  })

  it('rowStyle aplica el estilo y las clases de tinte a fila y card', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        rowHref={() => '/x'}
        rowStyle={(r) =>
          r.id === 1
            ? ({ '--row-tint': 'red', '--row-accent': 'blue' } as React.CSSProperties)
            : undefined
        }
      />,
    )
    const [tinted, plain] = Array.from(table().querySelectorAll('tbody tr'))
    expect(tinted.getAttribute('style')).toContain('--row-tint')
    expect(tinted.className).toContain('shadow-[inset_3px_0_0_var(--row-accent)]')
    expect(tinted.className).toContain('bg-(--row-tint)')
    expect(tinted.className).not.toContain('hover:bg-muted/50')
    expect(plain.hasAttribute('style')).toBe(false)
    expect(plain.className).toContain('hover:bg-muted/50')

    const [tintedCard, plainCard] = cards()
    expect(tintedCard.className).not.toContain('bg-card')
    expect(tintedCard.className).toContain('bg-(--row-tint)')
    expect(plainCard.className).toContain('bg-card')
    // A11Y-2: la fila teñida (tabla y tarjeta) sustituye el gris secundario
    // por uno que aguanta 4,5:1 sobre el tinte; la fila sin estado no.
    const tintedGray = '[--muted-foreground:var(--muted-foreground-tinted)]'
    expect(tinted.className).toContain(tintedGray)
    expect(tintedCard.className).toContain(tintedGray)
    expect(plain.className).not.toContain(tintedGray)
    expect(plainCard.className).not.toContain(tintedGray)
  })

  it('resizable monta colgroup con los anchos guardados y un asa por columna menos la última', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        resizable
        columnWidths={{ total: 120 }}
        onColumnWidthsChange={() => {}}
      />,
    )
    expect(table().className).toContain('table-fixed')
    const cols = Array.from(table().querySelectorAll('colgroup > col'))
    expect(cols).toHaveLength(3)
    expect(cols[1].getAttribute('style')).toContain('120px')
    // v0.9.0: sin `width` ni guardado, el ancho por defecto (sin relleno marcado).
    expect(cols[0].getAttribute('style')).toContain('160px')
    // Asa propia (borde derecho): todas menos la última. La última sí lleva la
    // mitad derecha de la zona del borde anterior (RESIZE-EDGE, v0.9.3).
    const handles = heads().map((th) => th.querySelector('[data-column-resize-handle=""]'))
    expect(handles.map(Boolean)).toEqual([true, true, false])
    const starts = heads().map((th) => th.querySelector('[data-column-resize-handle="start"]'))
    expect(starts.map(Boolean)).toEqual([false, true, true])
  })

  // Regresión C1 (bug de producción del 18/09, con captura): la primera card de
  // /sales/used salía con el título en una tira de un carácter por línea y los
  // botones ocupando todo el ancho. Causa: el slot de acciones de la card era
  // `shrink-0` en una fila sin `flex-wrap`, así que un grupo de 3 botones con
  // TEXTO (su `width: 220` es de la tabla de escritorio, table-fixed) se
  // quedaba con todo el hueco y el título con lo que sobraba.
  // jsdom no hace layout, así que lo que se fija aquí es la ESTRUCTURA que lo
  // impide: la cabecera de la card envuelve, el título tiene suelo de ancho y
  // no fuerza el salto él solo, y el bloque de acciones está acotado.
  it('C1 · un grupo de acciones ancho baja de línea en la card en vez de aplastar el título', () => {
    const withWideActions: ResponsiveColumn<Row>[] = [
      ...columns,
      {
        key: 'actions',
        header: 'Acciones',
        width: 220,
        action: true,
        cell: () => (
          <div className="flex flex-wrap gap-1">
            <button type="button">Poner a la venta</button>
            <button type="button">Contrato</button>
            <button type="button">Vender</button>
          </div>
        ),
      },
    ]
    render(<ResponsiveList columns={withWideActions} data={rows} rowKey={(r) => r.id} />)

    const card = cards()[0]
    const head = card.firstElementChild as HTMLElement
    // La cabecera de la card envuelve: el grupo de acciones puede caer a su
    // propia línea completa.
    expect(head.className).toContain('flex-wrap')

    // El título: suelo de ancho (min-w-32 = 128px) para que nadie lo comprima
    // por debajo de lo legible, y `flex-1` (base 0) para que un título largo no
    // provoque el salto por sí mismo — si lo hiciera, cambiaría el render de
    // los ~40 listados con acciones compactas.
    const title = card.querySelector('[data-list-card-title]') as HTMLElement
    expect(title).not.toBeNull()
    expect(title.className).toContain('min-w-32')
    expect(title.className).toContain('flex-1')
    expect(title.className).not.toContain('min-w-0')
    expect(title.textContent).toContain('Alfa')

    // El grupo de acciones: acotado al ancho de la card (su `shrink-0` sin
    // tope lo dejaría asomar por el borde) y con envoltura propia.
    const actionsBox = head.lastElementChild as HTMLElement
    expect(actionsBox).not.toBe(title)
    expect(actionsBox.textContent).toContain('Vender')
    expect(actionsBox.className).toContain('max-w-full')
    expect(actionsBox.className).toContain('flex-wrap')
  })

  it('las acciones compactas (badge, menú de fila) siguen en la misma línea que el título', () => {
    const withBadge: ResponsiveColumn<Row>[] = [
      ...columns,
      { key: 'state', header: '', cell: () => <span>OK</span>, action: true },
    ]
    render(<ResponsiveList columns={withBadge} data={rows} rowKey={(r) => r.id} />)
    const head = cards()[0].firstElementChild as HTMLElement
    // Dos hijos: título y slot de acciones. El salto de línea lo decide el
    // navegador midiendo el contenido; aquí se fija que no se ha introducido
    // ningún contenedor extra ni se ha movido el slot fuera de la cabecera.
    expect(head.children).toHaveLength(2)
    expect(head.children[0].hasAttribute('data-list-card-title')).toBe(true)
    expect(head.children[1].textContent).toBe('OK')
  })

  it('resizable: una columna action sin cabecera cae al ancho compacto por defecto, una CON cabecera y la primary sin `width` toman el por defecto', () => {
    const withAction: ResponsiveColumn<Row>[] = [
      ...columns,
      { key: 'remove', header: '', cell: () => null, action: true },
      // Icono-puro con `header: ''` (convención existente): sigue cayendo al
      // ancho compacto. Distinto de una `action` CON texto de cabecera (p.ej.
      // un botón con etiqueta), que no debe recortarse a 56px.
      { key: 'quote', header: 'Presupuesto', cell: () => null, action: true },
    ]
    render(
      <ResponsiveList
        columns={withAction}
        data={rows}
        rowKey={(r) => r.id}
        resizable
        onColumnWidthsChange={() => {}}
      />,
    )
    const cols = Array.from(table().querySelectorAll('colgroup > col'))
    expect(cols).toHaveLength(5)
    // v0.9.0: `name` es primary sin `width` pero NO es relleno sin `fill`: 160 px.
    expect(cols[0].getAttribute('style')).toContain('160px')
    // `remove` es action SIN cabecera y sin ancho propio: ancho compacto por defecto.
    expect(cols[3].getAttribute('style')).toContain('56px')
    // `quote` es action CON cabecera (botón con texto): sin `width` propio
    // toma el ancho por defecto de cualquier columna de datos — 56px la
    // habría recortado (ver BikesListPage: «Presupuesto de venta» → «enta»).
    expect(cols[4].getAttribute('style')).toContain('160px')
  })

  it('rowHref usa el Link y el navigate del UiProvider', () => {
    const navigate = vi.fn<(href: string) => void>()
    const seen: string[] = []
    function AppLink({ href, ...props }: UiLinkProps) {
      seen.push(href)
      return <a data-app-link href={href} {...props} />
    }
    render(
      <UiProvider Link={AppLink} navigate={navigate}>
        <ResponsiveList
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => (r.id === 1 ? `/x/${r.id}` : undefined)}
        />
      </UiProvider>,
    )
    // Tabla + card de la fila 1 (la 2 no navega).
    expect(container.querySelectorAll('a[data-app-link]')).toHaveLength(2)
    expect(seen).toContain('/x/1')

    // Click en otra celda de la fila: navegación imperativa del provider.
    const [row1, row2] = Array.from(table().querySelectorAll('tbody tr'))
    click(row1.querySelectorAll('td')[1])
    expect(navigate).toHaveBeenCalledWith('/x/1')
    click(row2.querySelectorAll('td')[1])
    expect(navigate).toHaveBeenCalledTimes(1)

    // Click en el propio enlace: navega él; la fila no lo repite.
    const link = row1.querySelector('a')!
    link.addEventListener('click', (e) => e.preventDefault())
    click(link)
    expect(navigate).toHaveBeenCalledTimes(1)

    // cmd/ctrl+click abre en pestaña nueva, como un enlace.
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    act(() => {
      row1
        .querySelectorAll('td')[1]
        .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }))
    })
    expect(open).toHaveBeenCalledWith('/x/1', '_blank', 'noopener')
    expect(navigate).toHaveBeenCalledTimes(1)
    open.mockRestore()
  })

  it('sin provider, la fila-enlace es un <a> normal', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/x/${r.id}`}
      />,
    )
    const a = table().querySelector('tbody tr a')!
    expect(a.tagName).toBe('A')
    expect(a.getAttribute('href')).toBe('/x/1')
  })

  it('los textos del menú salen del provider y la prop `labels` gana', () => {
    const ui = (labels?: { columnsMenu: string }) => (
      <UiProvider labels={{ columnsMenu: 'Columns' }}>
        <ResponsiveList
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          hiddenColumns={[]}
          onHiddenColumnsChange={() => {}}
          onColumnsReset={() => {}}
          labels={labels}
        />
      </UiProvider>
    )
    render(ui())
    const menuHead = () => heads()[heads().length - 1]
    expect(menuHead().querySelector('button')!.getAttribute('aria-label')).toBe('Columns')
    render(ui({ columnsMenu: 'Spalten' }))
    expect(menuHead().querySelector('button')!.getAttribute('aria-label')).toBe('Spalten')
  })

  it('A11Y-7: las cabeceras de acciones y de selección llevan nombre sr-only', () => {
    render(
      <ResponsiveList
        columns={[
          { key: 'name', header: 'Nombre', primary: true, cell: (r) => r.id },
          { key: 'act', header: '', cell: () => <span>x</span>, action: true },
        ]}
        data={rows}
        rowKey={(r) => r.id}
        leading={() => <input type="checkbox" aria-label="fila" />}
      />,
    )
    const hs = heads()
    expect(hs[0].querySelector('.sr-only')!.textContent).toBe('Seleccionar')
    expect(hs[2].querySelector('.sr-only')!.textContent).toBe('Acciones')
    for (const h of hs) expect(h.textContent!.trim()).not.toBe('')
  })

  it('A11Y-7: los nombres de esas cabeceras se pueden traducir con `labels`', () => {
    render(
      <ResponsiveList
        columns={[
          { key: 'name', header: 'Name', primary: true, cell: (r) => r.id },
          { key: 'act', header: '', cell: () => <span>x</span>, action: true },
        ]}
        data={rows}
        rowKey={(r) => r.id}
        leading={() => <input type="checkbox" aria-label="row" />}
        labels={{ actionsColumn: 'Actions', selectColumn: 'Select' }}
      />,
    )
    const hs = heads()
    expect(hs[0].textContent).toBe('Select')
    expect(hs[2].textContent).toBe('Actions')
  })

  it('por defecto los textos son en español', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
      />,
    )
    expect(heads()[heads().length - 1].querySelector('button')!.getAttribute('aria-label')).toBe(
      'Columnas',
    )
  })

  it('mobileColumnsMenu: por defecto pinta el menú encima de las cards (solo con los dos callbacks)', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} />)
    expect(mobileMenu()).toBeNull()
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} mobileColumnsMenu />)
    expect(mobileMenu()).toBeNull()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
      />,
    )
    expect(mobileMenu()).not.toBeNull()
    expect(mobileMenu()!.closest('.\\@3xl\\:hidden')).not.toBeNull()
    expect(mobileMenu()!.querySelector('button')).not.toBeNull()
    // El menú no cuenta como tarjeta.
    expect(cards()).toHaveLength(rows.length)
  })

  it('mobileColumnsMenu={false} quita el menú de móvil (lo pinta el ListFooter)', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        mobileColumnsMenu={false}
      />,
    )
    expect(mobileMenu()).toBeNull()
    // El de escritorio (cabecera de la tabla) sigue ahí.
    expect(heads()[heads().length - 1].querySelector('button')).not.toBeNull()
  })

  it('mobileHideWhen omite la fila label/valor de la card, no la celda de la tabla', () => {
    const withHide: ResponsiveColumn<Row>[] = [
      columns[0],
      { ...columns[1], mobileHideWhen: (r) => r.id === 1 },
    ]
    render(<ResponsiveList columns={withHide} data={rows} rowKey={(r) => r.id} />)
    const labels = (i: number) =>
      Array.from(cards()[i].querySelectorAll('dt')).map((dt) => dt.textContent)
    expect(labels(0)).toEqual([])
    expect(labels(1)).toEqual(['Total'])
    expect(table().querySelectorAll('tbody tr')[0].querySelectorAll('td')[1].textContent).toBe('10')
  })
})

describe('ResponsiveList (modo compacto)', () => {
  const wrapCols: ResponsiveColumn<Row>[] = [
    { ...columns[0], cellClassName: 'whitespace-normal', headClassName: 'whitespace-normal' },
    columns[1],
    { key: 'menu', cell: () => <button type="button">Menú</button>, action: true },
  ]

  it('sin `compact` no cambia el markup (ni data-compact ni clases)', () => {
    render(<ResponsiveList columns={wrapCols} data={rows} rowKey={(r) => r.id} />)
    const base = container.innerHTML
    expect(container.querySelector('[data-compact]')).toBeNull()
    render(<ResponsiveList columns={wrapCols} data={rows} rowKey={(r) => r.id} compact={false} />)
    expect(container.innerHTML).toBe(base)
  })

  it('escritorio: data-compact en la tabla, celdas no-acción en una línea con elipsis que ganan al consumidor', () => {
    render(<ResponsiveList columns={wrapCols} data={rows} rowKey={(r) => r.id} compact />)
    expect(table().hasAttribute('data-compact')).toBe(true)
    const tds = Array.from(table().querySelectorAll('tbody tr')[0].querySelectorAll('td'))
    // El `whitespace-normal` del consumidor pierde (tailwind-merge, va después).
    expect(tds[0].className).toContain('whitespace-nowrap')
    expect(tds[0].className).not.toContain('whitespace-normal')
    for (const cls of ['overflow-hidden', 'text-ellipsis']) {
      expect(tds[0].className).toContain(cls)
      expect(tds[1].className).toContain(cls)
    }
    // La columna `action` no se recorta.
    expect(tds[2].className).not.toContain('text-ellipsis')
    // Cabeceras sin envolver, también contra `headClassName`.
    expect(heads()[0].className).toContain('whitespace-nowrap')
    expect(heads()[0].className).not.toContain('whitespace-normal')
  })

  it('móvil: data-compact en cada tarjeta, <dd> con truncate y acciones sin flex-wrap', () => {
    render(<ResponsiveList columns={wrapCols} data={rows} rowKey={(r) => r.id} compact />)
    for (const card of cards()) {
      expect(card.hasAttribute('data-compact')).toBe(true)
      const dd = card.querySelector('dd')!
      expect(dd.className).toContain('truncate')
      expect(dd.className).not.toContain('break-words')
      const actionsBox = card.querySelector('button')!.parentElement!.parentElement!
      expect(actionsBox.className).toContain('flex-nowrap')
      expect(actionsBox.className).toContain('overflow-hidden')
      expect(actionsBox.classList.contains('flex-wrap')).toBe(false)
    }
    // Sin compacto, como siempre.
    render(<ResponsiveList columns={wrapCols} data={rows} rowKey={(r) => r.id} />)
    const dd = cards()[0].querySelector('dd')!
    expect(dd.className).toContain('break-words')
    expect(cards()[0].querySelector('button')!.parentElement!.parentElement!.className).toContain(
      'flex-wrap',
    )
  })

  it('useListCompact() da el modo a las celdas (tabla y tarjetas)', () => {
    function Mode() {
      return <>{useListCompact() ? 'C' : 'N'}</>
    }
    const cols: ResponsiveColumn<Row>[] = [
      { key: 'name', header: 'Nombre', cell: (r) => r.name, primary: true },
      { key: 'mode', header: 'Modo', cell: () => <Mode /> },
    ]
    render(<ResponsiveList columns={cols} data={rows} rowKey={(r) => r.id} compact />)
    expect(table().querySelector('tbody td:nth-child(2)')!.textContent).toBe('C')
    expect(cards()[0].querySelector('dd')!.textContent).toBe('C')
    render(<ResponsiveList columns={cols} data={rows} rowKey={(r) => r.id} />)
    expect(table().querySelector('tbody td:nth-child(2)')!.textContent).toBe('N')
  })

  it('compact/onCompactChange llegan al ColumnsMenu (casilla «Modo compacto»)', async () => {
    const { fireEvent, screen } = await import('@testing-library/react')
    const onCompactChange = vi.fn()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        mobileColumnsMenu={false}
        compact
        onCompactChange={onCompactChange}
      />,
    )
    const trigger = heads()[heads().length - 1].querySelector('button')!
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter' })
    })
    const item = screen.getByRole('menuitemcheckbox', { name: 'Modo compacto' })
    expect(item.getAttribute('aria-checked')).toBe('true')
    act(() => {
      fireEvent.click(item)
    })
    expect(onCompactChange).toHaveBeenCalledWith(false)
  })

  it('v0.7.0: pageSize/onPageSizeChange llegan al menú de la cabecera (submenú «Filas por página»)', async () => {
    const { fireEvent, screen } = await import('@testing-library/react')
    const onPageSizeChange = vi.fn()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        mobileColumnsMenu={false}
        pageSize={10}
        onPageSizeChange={onPageSizeChange}
      />,
    )
    const trigger = heads()[heads().length - 1].querySelector('button')!
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter' })
    })
    act(() => {
      fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Filas por página' }), {
        key: 'ArrowRight',
      })
    })
    expect(screen.getByRole('menuitemradio', { name: '10' }).getAttribute('aria-checked')).toBe('true')
    act(() => {
      fireEvent.click(screen.getByRole('menuitemradio', { name: '100' }))
    })
    expect(onPageSizeChange).toHaveBeenCalledWith(100)
  })
})

describe('ResponsiveList (orden de columnas)', () => {
  // jsdom no trae DragEvent/DataTransfer: un Event con un `dataTransfer` falso
  // basta para los handlers de React (leen `e.dataTransfer`).
  function dnd(type: string, el: Element) {
    const ev = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'dataTransfer', {
      value: { setData: () => {}, getData: () => '', effectAllowed: 'all', dropEffect: 'none' },
    })
    act(() => {
      el.dispatchEvent(ev)
    })
    return ev
  }
  class FakePointerEvent extends MouseEvent {
    pointerId = 1
  }
  const headKeys = () => heads().map((th) => th.textContent)
  const withActions: ResponsiveColumn<Row>[] = [
    ...columns,
    { key: 'menu', cell: () => '⋯', action: true },
  ]

  it('aplica columnOrder a cabeceras, celdas y colgroup; las action se quedan al final', () => {
    render(
      <ResponsiveList
        columns={withActions}
        data={rows}
        rowKey={(r) => r.id}
        resizable
        columnOrder={['id', 'menu', 'total', 'name']}
      />,
    )
    expect(headKeys()).toEqual(['Id', 'Total', 'Nombre', 'Acciones'])
    const cells = Array.from(table().querySelectorAll('tbody tr')[0].querySelectorAll('td'))
    expect(cells.map((td) => td.textContent)).toEqual(['1', '10', 'Alfa', '⋯'])
    expect(table().querySelectorAll('colgroup col')).toHaveLength(4)
  })

  it('móvil: el <dl> sigue el orden guardado y el título sigue siendo la primary', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        columnOrder={['id', 'total', 'name']}
      />,
    )
    const card = cards()[0]
    expect(card.querySelector('[data-list-card-title]')!.textContent).toBe('Alfa')
    expect(Array.from(card.querySelectorAll('dt')).map((dt) => dt.textContent)).toEqual([
      'Id',
      'Total',
    ])
  })

  it('la primary puede quedar en cualquier posición de la tabla', () => {
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        columnOrder={['total', 'id', 'name']}
      />,
    )
    expect(headKeys()).toEqual(['Total', 'Id', 'Nombre'])
  })

  it('sin onColumnOrderChange las cabeceras no son arrastrables', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} />)
    expect(heads().some((th) => th.hasAttribute('draggable'))).toBe(false)
    expect(heads().some((th) => th.hasAttribute('data-column-key'))).toBe(false)
  })

  it('arrastrar una cabecera la mueve, con indicador de dónde cae, y llama a onColumnOrderChange', () => {
    const onColumnOrderChange = vi.fn<(order: string[]) => void>()
    render(
      <ResponsiveList
        columns={withActions}
        data={rows}
        rowKey={(r) => r.id}
        onColumnOrderChange={onColumnOrderChange}
      />,
    )
    const [nameTh, totalTh, idTh, menuTh] = heads()
    expect(nameTh.getAttribute('draggable')).toBe('true')
    expect(nameTh.className).toContain('cursor-grab')
    // La columna de acciones ni se arrastra ni recibe.
    expect(menuTh.hasAttribute('draggable')).toBe(false)

    // Nombre (primera) → sobre Id: cae DETRÁS de Id.
    dnd('dragstart', nameTh)
    expect(heads()[0].hasAttribute('data-dragging')).toBe(true)
    const over = dnd('dragover', idTh)
    expect(over.defaultPrevented).toBe(true)
    expect(heads()[2].getAttribute('data-drop')).toBe('after')
    expect(
      heads()[2].querySelector('[data-column-drop-indicator="after"]')!.className,
    ).toContain('right-0')
    dnd('drop', heads()[2])
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(['total', 'id', 'name', 'menu'])
    expect(container.querySelector('[data-column-drop-indicator]')).toBeNull()
    expect(heads()[0].hasAttribute('data-dragging')).toBe(false)

    // Id (última movible) → sobre Total: cae DELANTE de Total.
    dnd('dragstart', heads()[2])
    dnd('dragover', totalTh)
    expect(heads()[1].getAttribute('data-drop')).toBe('before')
    dnd('drop', heads()[1])
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(['name', 'id', 'total', 'menu'])

    // Soltar sobre la columna de acciones no hace nada.
    onColumnOrderChange.mockClear()
    dnd('dragstart', heads()[0])
    const onMenu = dnd('dragover', heads()[3])
    expect(onMenu.defaultPrevented).toBe(false)
    dnd('drop', heads()[3])
    dnd('dragend', heads()[0])
    expect(onColumnOrderChange).not.toHaveBeenCalled()
  })

  it('un clic simple en una cabecera ordenable sigue ordenando (y no reordena)', () => {
    const onSortChange = vi.fn<(next: ListSort) => void>()
    const onColumnOrderChange = vi.fn()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        sort={null}
        onSortChange={onSortChange}
        onColumnOrderChange={onColumnOrderChange}
      />,
    )
    const button = heads()[1].querySelector('button')!
    act(() => {
      button.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0 }))
    })
    click(button)
    expect(onSortChange).toHaveBeenCalledWith({ key: 'total', dir: 'asc' })
    expect(onColumnOrderChange).not.toHaveBeenCalled()
  })

  it('arrastrar desde el asa de redimensión no reordena', () => {
    const setPointerCapture = Element.prototype.setPointerCapture
    Element.prototype.setPointerCapture = vi.fn()
    try {
      const onColumnOrderChange = vi.fn()
      render(
        <ResponsiveList
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          resizable
          onColumnWidthsChange={() => {}}
          onColumnOrderChange={onColumnOrderChange}
        />,
      )
      const handle = heads()[0].querySelector('[data-column-resize-handle]')!
      act(() => {
        handle.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0 }))
      })
      const start = dnd('dragstart', heads()[0])
      expect(start.defaultPrevented).toBe(true)
      expect(heads()[0].hasAttribute('data-dragging')).toBe(false)
      const over = dnd('dragover', heads()[2])
      expect(over.defaultPrevented).toBe(false)
      dnd('drop', heads()[2])
      expect(onColumnOrderChange).not.toHaveBeenCalled()
      act(() => {
        handle.dispatchEvent(new FakePointerEvent('pointerup', { bubbles: true }))
      })
      // Tras el redimensionado, un arrastre normal vuelve a funcionar.
      act(() => {
        heads()[0].dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0 }))
      })
      dnd('dragstart', heads()[0])
      dnd('dragover', heads()[2])
      dnd('drop', heads()[2])
      expect(onColumnOrderChange).toHaveBeenCalledWith(['total', 'id', 'name'])
    } finally {
      Element.prototype.setPointerCapture = setPointerCapture
    }
  })

  it('RESIZE-EDGE-1: agarrar justo a la DERECHA de la línea (borde izquierdo de la vecina) no reordena', () => {
    const setPointerCapture = Element.prototype.setPointerCapture
    Element.prototype.setPointerCapture = vi.fn()
    try {
      const onColumnOrderChange = vi.fn()
      const onColumnWidthsChange = vi.fn()
      render(
        <ResponsiveList
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          resizable
          onColumnWidthsChange={onColumnWidthsChange}
          onColumnOrderChange={onColumnOrderChange}
        />,
      )
      // La primera cabecera no tiene borde anterior: sin zona de inicio.
      expect(heads()[0].querySelector('[data-column-resize-handle="start"]')).toBeNull()
      const zone = heads()[1].querySelector('[data-column-resize-handle="start"]')!
      expect(zone).not.toBeNull()
      act(() => {
        zone.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 0 }))
      })
      const start = dnd('dragstart', heads()[1])
      expect(start.defaultPrevented).toBe(true)
      dnd('dragover', heads()[2])
      dnd('drop', heads()[2])
      expect(onColumnOrderChange).not.toHaveBeenCalled()
      act(() => {
        zone.dispatchEvent(new FakePointerEvent('pointermove', { bubbles: true, clientX: 30 }))
      })
      act(() => {
        zone.dispatchEvent(new FakePointerEvent('pointerup', { bubbles: true, clientX: 30 }))
      })
      // Redimensiona la columna ANTERIOR (la de la línea), nunca la vecina.
      expect(onColumnWidthsChange).toHaveBeenCalledTimes(1)
      const saved = onColumnWidthsChange.mock.calls[0][0] as Record<string, number>
      expect(Object.keys(saved)).toEqual([heads()[0].getAttribute('data-column-width-key')])
    } finally {
      Element.prototype.setPointerCapture = setPointerCapture
    }
  })

  it('v0.6.0: el botón del menú ni arrastra la cabecera ni es zona de soltar; la última <th> sigue recibiendo', () => {
    const onColumnOrderChange = vi.fn()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        hiddenColumns={[]}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        onColumnOrderChange={onColumnOrderChange}
      />,
    )
    const last = heads()[2]
    const menu = last.querySelector('[data-list-columns-menu-head]')!
    const trigger = menu.querySelector('button')!
    // Tab: el botón va detrás de los botones de ordenar/cabeceras en el DOM.
    const focusables = Array.from(table().querySelectorAll('thead button'))
    expect(focusables[focusables.length - 1]).toBe(trigger)
    // Pulsar el botón y «arrastrar» no mueve la columna.
    act(() => {
      trigger.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0 }))
    })
    const start = dnd('dragstart', last)
    expect(start.defaultPrevented).toBe(true)
    expect(last.hasAttribute('data-dragging')).toBe(false)
    // Arrastrando otra cabecera, encima del botón no se puede soltar…
    act(() => {
      heads()[0].dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0 }))
    })
    dnd('dragstart', heads()[0])
    expect(dnd('dragover', menu).defaultPrevented).toBe(false)
    dnd('drop', menu)
    expect(onColumnOrderChange).not.toHaveBeenCalled()
    // …pero sí sobre el resto de la última cabecera, con indicador (sombra:
    // esa <th> va sin posicionar para no atrapar al botón).
    expect(dnd('dragover', heads()[2]).defaultPrevented).toBe(true)
    expect(heads()[2].getAttribute('data-drop')).toBe('after')
    expect(heads()[2].className).toContain('shadow-[inset_-2px_0_0_var(--color-primary)]')
    expect(heads()[2].querySelector('[data-column-drop-indicator]')).toBeNull()
    dnd('drop', heads()[2])
    expect(onColumnOrderChange).toHaveBeenCalledWith(['total', 'id', 'name'])
  })

  it('columnOrder y onColumnOrderChange llegan al ColumnsMenu (lista en orden + Subir/Bajar)', async () => {
    const { fireEvent, screen } = await import('@testing-library/react')
    const onColumnOrderChange = vi.fn()
    render(
      <ResponsiveList
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        onHiddenColumnsChange={() => {}}
        onColumnsReset={() => {}}
        mobileColumnsMenu={false}
        columnOrder={['id', 'name', 'total']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    )
    const trigger = heads()[heads().length - 1].querySelector('button')!
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter' })
    })
    expect(
      screen.getAllByRole('menuitemcheckbox').map((el) => el.textContent),
    ).toEqual(['Id', 'Nombre', 'Total'])
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Bajar Id' }))
    })
    expect(onColumnOrderChange).toHaveBeenCalledWith(['name', 'id', 'total'])
  })
})
// v0.9.0 · Modelo «como Excel + relleno»: arrastrar el borde cambia SOLO esa
// columna; la tabla mide máx(contenedor, suma) y la columna `fill` (si la hay)
// se estira para ocupar el hueco. jsdom no hace layout: se mide con un
// getBoundingClientRect falso por `data-column-width-key`, y lo que se
// comprueba es el <colgroup> y el estilo de la <table> (lo que manda en
// table-fixed) y lo que se guarda.
describe('ResponsiveList (como Excel + relleno)', () => {
  type ORow = { id: number }
  // Como el listado de Órdenes de Gesmoto: Nº estrecho (nunca relleno),
  // cliente sin `width`, descripción de relleno, Apertura, estado y menú.
  const oColumns: ResponsiveColumn<ORow>[] = [
    { key: 'num', header: 'Nº', cell: () => '1', primary: true, width: 90 },
    { key: 'client', header: 'Cliente', cell: () => 'c' },
    { key: 'desc', header: 'Descripción', cell: () => 'd', fill: true },
    { key: 'opened', header: 'Apertura', cell: () => '19/10/2026', width: 120 },
    { key: 'status', header: 'Estado', cell: () => 's', width: 130 },
    { key: 'menu', header: '', cell: () => '⋯', action: true },
  ]
  // 90 + 160 + 160 + 120 + 130 + 56
  const SUM = 716
  const oRows: ORow[] = [{ id: 1 }]
  let measured: Record<string, number>
  const originalRect = HTMLElement.prototype.getBoundingClientRect
  const originalCapture = Element.prototype.setPointerCapture

  class FakePointerEvent extends MouseEvent {
    pointerId = 1
  }
  beforeEach(() => {
    // El relleno «al mínimo»: el hueco que le queda es ya su suelo.
    measured = { num: 90, client: 160, desc: 64, opened: 120, status: 130, menu: 56 }
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const key = this.getAttribute('data-column-width-key')
      return { width: key ? (measured[key] ?? 0) : 0 } as DOMRect
    }
    Element.prototype.setPointerCapture = vi.fn()
  })
  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalRect
    Element.prototype.setPointerCapture = originalCapture
  })

  function renderO(props: Partial<React.ComponentProps<typeof ResponsiveList<ORow>>> = {}) {
    const onColumnWidthsChange = vi.fn<(w: Record<string, number>) => void>()
    render(
      <ResponsiveList
        columns={oColumns}
        data={oRows}
        rowKey={(r) => r.id}
        resizable
        onColumnWidthsChange={onColumnWidthsChange}
        {...props}
      />,
    )
    return onColumnWidthsChange
  }
  /** Ancho de cada <col> por clave de columna (null = sin ancho: el relleno). */
  function colWidths(): Record<string, string | null> {
    const keys = heads().map((th) => th.getAttribute('data-column-width-key')!)
    const cols = Array.from(table().querySelectorAll('colgroup > col'))
    return Object.fromEntries(keys.map((k, i) => [k, (cols[i] as HTMLElement).style.width || null]))
  }
  const tableStyle = () => ({ width: table().style.width, minWidth: table().style.minWidth })
  function handleOf(key: string) {
    return heads()
      .find((th) => th.getAttribute('data-column-width-key') === key)!
      .querySelector('[data-column-resize-handle]')!
  }
  function dragHandle(key: string, dx: number, { release = true } = {}) {
    const el = handleOf(key)
    act(() => {
      el.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 0 }))
    })
    act(() => {
      el.dispatchEvent(new FakePointerEvent('pointermove', { bubbles: true, clientX: dx }))
    })
    if (release) {
      act(() => {
        el.dispatchEvent(new FakePointerEvent('pointerup', { bubbles: true, clientX: dx }))
      })
    }
  }
  const BASE = {
    num: '90px',
    client: '160px',
    desc: null,
    opened: '120px',
    status: '130px',
    menu: '56px',
  }

  it('todas con ancho salvo el relleno; la tabla: 100 % con la suma de mínimo', () => {
    renderO()
    expect(colWidths()).toEqual(BASE)
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM}px` })
  })

  it('arrastrar Apertura cambia SOLO Apertura aunque el relleno esté al mínimo; la tabla crece (scroll)', () => {
    const onChange = renderO()
    dragHandle('opened', 200, { release: false })
    expect(colWidths()).toEqual({ ...BASE, opened: '320px' })
    // Suma > contenedor: la tabla mide la suma y el contenedor hace scroll.
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM + 200}px` })
    act(() => {
      handleOf('opened').dispatchEvent(
        new FakePointerEvent('pointerup', { bubbles: true, clientX: 200 }),
      )
    })
    expect(onChange).toHaveBeenCalledWith({ opened: 320 })
  })

  it('suma < contenedor: el relleno se estira (sin <col> width) y el resto queda idéntico', () => {
    renderO({ columnWidths: { opened: 100 } })
    // 100 % del contenedor con la suma de mínimo: lo que sobre es del relleno.
    expect(colWidths()).toEqual({ ...BASE, opened: '100px' })
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM - 20}px` })
  })

  it('sin relleno marcado: ninguna se estira, la tabla mide la suma (hueco a la derecha)', () => {
    renderO({ columns: oColumns.map((c) => (c.key === 'desc' ? { ...c, fill: undefined } : c)) })
    expect(colWidths()).toEqual({ ...BASE, desc: '160px' })
    expect(tableStyle()).toEqual({ width: `${SUM}px`, minWidth: '' })
  })

  it('la primary NO es relleno por defecto (el Nº nunca debería serlo)', () => {
    renderO({
      columns: oColumns.map((c) =>
        c.key === 'desc' ? { ...c, fill: undefined } : c.key === 'num' ? { ...c, width: undefined } : c,
      ),
    })
    expect(colWidths().num).toBe('160px')
    expect(tableStyle().width).toBe(`${SUM + 70}px`)
  })

  it('`flex: true` (v0.5.0) es alias de `fill`', () => {
    renderO({
      columns: oColumns.map((c) =>
        c.key === 'desc' ? { ...c, fill: undefined, flex: true } : c,
      ),
    })
    expect(colWidths()).toEqual(BASE)
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM}px` })
  })

  it('arrastrar el relleno parte de su ancho pintado y guarda su base', () => {
    measured.desc = 500
    const onChange = renderO()
    dragHandle('desc', -100)
    expect(onChange).toHaveBeenCalledWith({ desc: 400 })
  })

  it('RESIZE-EDGE-2: el borde izquierdo de la cabecera siguiente redimensiona la anterior (también el relleno, desde su ancho pintado)', () => {
    measured.desc = 500
    const onChange = renderO()
    const startZone = (key: string) =>
      heads()
        .find((th) => th.getAttribute('data-column-width-key') === key)!
        .querySelector('[data-column-resize-handle="start"]')!
    function dragStart(key: string, dx: number) {
      const el = startZone(key)
      act(() => {
        el.dispatchEvent(new FakePointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 0 }))
      })
      act(() => {
        el.dispatchEvent(new FakePointerEvent('pointermove', { bubbles: true, clientX: dx }))
      })
      act(() => {
        el.dispatchEvent(new FakePointerEvent('pointerup', { bubbles: true, clientX: dx }))
      })
    }
    // «Apertura» va tras el relleno: su borde izquierdo es el del relleno.
    dragStart('opened', 40)
    expect(onChange).toHaveBeenLastCalledWith({ desc: 540 })
    dragStart('client', 30)
    expect(onChange).toHaveBeenLastCalledWith({ num: 120 })
  })

  it('suelo `minWidth`: ni un guardado viejo ni el arrastre bajan de él', () => {
    const onChange = renderO({
      columns: oColumns.map((c) => (c.key === 'opened' ? { ...c, minWidth: 110 } : c)),
      columnWidths: { opened: 30 },
    })
    expect(colWidths().opened).toBe('110px')
    dragHandle('opened', -50)
    expect(onChange).toHaveBeenCalledWith({ opened: 110 })
  })

  it('prefs viejas con anchos raros se respetan (con suelo 64); un guardado del relleno lo fija (v0.9.3)', () => {
    renderO({ columnWidths: { client: 999, status: 5, desc: 300 } })
    expect(colWidths()).toEqual({ ...BASE, client: '999px', status: '64px', desc: '300px' })
    // Sin relleno: la suma exacta.
    expect(tableStyle()).toEqual({ width: `${90 + 999 + 300 + 120 + 64 + 56}px`, minWidth: '' })
  })

  it('RESIZE-FILL-1: con ancho guardado el relleno deja de rellenar: su <col> lleva ese ancho y la tabla mide la suma (hueco a la derecha)', () => {
    renderO({ columnWidths: { desc: 200 } })
    // Las demás, idénticas (nadie se estira); la tabla, la suma exacta: sin
    // `width: 100%` table-fixed no reparte el sobrante, y sin `min-width` de
    // más no hay scroll si cabe.
    expect(colWidths()).toEqual({ ...BASE, desc: '200px' })
    expect(tableStyle()).toEqual({ width: `${SUM - 160 + 200}px`, minWidth: '' })
  })

  it('RESIZE-FILL-2: estrechar el relleno estirado se ve en vivo y se guarda (antes no encogía)', () => {
    measured.desc = 500
    const onChange = renderO()
    dragHandle('desc', -150, { release: false })
    // Durante el arrastre ya no rellena: su <col> sigue al puntero.
    expect(colWidths().desc).toBe('350px')
    expect(tableStyle()).toEqual({ width: `${SUM - 160 + 350}px`, minWidth: '' })
    act(() => {
      handleOf('desc').dispatchEvent(
        new FakePointerEvent('pointerup', { bubbles: true, clientX: -150 }),
      )
    })
    expect(onChange).toHaveBeenCalledWith({ desc: 350 })
  })

  it('RESIZE-FILL-3: doble clic en el asa del relleno (borde propio o el de la vecina) borra su ancho y vuelve a rellenar', () => {
    const onChange = renderO({ columnWidths: { desc: 200, opened: 150 } })
    act(() => {
      handleOf('desc').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenLastCalledWith({ opened: 150 })
    const startZone = heads()
      .find((th) => th.getAttribute('data-column-width-key') === 'opened')!
      .querySelector('[data-column-resize-handle="start"]')!
    act(() => {
      startZone.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith({ opened: 150 })
  })

  it('RESIZE-FILL-4: sin ancho guardado el relleno vuelve: <col> sin ancho y tabla 100 % con la suma de mínimo', () => {
    renderO({ columnWidths: { opened: 150 } })
    expect(colWidths()).toEqual({ ...BASE, opened: '150px' })
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM - 120 + 150}px` })
  })

  it('RESIZE-FILL-5: con el relleno fijado, otra columna marcada `fill` NO pasa a rellenar', () => {
    renderO({
      columns: oColumns.map((c) => (c.key === 'opened' ? { ...c, fill: true } : c)),
      columnWidths: { desc: 200 },
    })
    expect(colWidths()).toEqual({ ...BASE, desc: '200px' })
    expect(tableStyle().width).toBe(`${SUM - 160 + 200}px`)
  })

  it('doble clic borra el ancho guardado de la columna', () => {
    const onChange = renderO({ columnWidths: { opened: 150, client: 200 } })
    act(() => {
      handleOf('opened').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenCalledWith({ client: 200 })
  })

  it('con orden de columnas y modo compacto: arrastrar sigue cambiando solo la arrastrada', () => {
    const onChange = renderO({
      columnOrder: ['client', 'num', 'opened', 'desc', 'status', 'menu'],
      onColumnOrderChange: () => {},
      compact: true,
    })
    expect(heads().map((th) => th.getAttribute('data-column-width-key'))).toEqual([
      'client',
      'num',
      'opened',
      'desc',
      'status',
      'menu',
    ])
    dragHandle('num', 30)
    expect(onChange).toHaveBeenCalledWith({ num: 120 })
    expect(table().getAttribute('data-compact')).toBe('')
  })

  it('con selección (`leading`), su columna de 40 px entra en la suma', () => {
    renderO({ leading: () => <input type="checkbox" /> })
    expect(table().querySelectorAll('colgroup > col')).toHaveLength(oColumns.length + 1)
    expect(tableStyle().minWidth).toBe(`${SUM + 40}px`)
  })

  it('cabecera fija + menú: la tabla sigue midiendo la suma y el botón va en la última <th> sticky', () => {
    renderO({
      stickyHeader: true,
      hiddenColumns: [],
      onHiddenColumnsChange: () => {},
      onColumnsReset: () => {},
      mobileColumnsMenu: false,
    })
    expect(tableStyle()).toEqual({ width: '100%', minWidth: `${SUM}px` })
    const last = heads()[heads().length - 1]
    expect(last.className).toContain('sticky')
    const menu = last.querySelector('[data-list-columns-menu-head]')!
    expect(menu.className).toContain('bg-inherit')
  })
})

// v0.9.0 · El botón del menú de columnas no impone color: hereda el fondo
// real de su cabecera (tarjeta, cabecera teñida, transparente, modo oscuro).
describe('ResponsiveList (fondo del botón del menú de columnas)', () => {
  const menuProps = {
    hiddenColumns: [] as string[],
    onHiddenColumnsChange: () => {},
    onColumnsReset: () => {},
    mobileColumnsMenu: false,
  }
  const menuEl = () => table().querySelector('[data-list-columns-menu-head]') as HTMLElement
  const bgClasses = (el: Element) => el.className.split(/\s+/).filter((c) => /^bg-/.test(c))

  it('dentro de una tarjeta `bg-card`: el botón no lleva `bg-background` fijo', () => {
    render(
      <div className="bg-card">
        <ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} {...menuProps} />
      </div>,
    )
    expect(menuEl().className).not.toContain('bg-background')
    expect(bgClasses(menuEl())).toEqual(['bg-inherit'])
  })

  it('cabecera con `bg-muted`: el botón hereda, no impone otro color', () => {
    const tinted = columns.map((c) => ({ ...c, headClassName: 'bg-muted' }))
    render(<ResponsiveList columns={tinted} data={rows} rowKey={(r) => r.id} {...menuProps} />)
    const th = menuEl().closest('th')!
    // El fondo del consumidor gana en la <th> y el botón lo hereda.
    expect(bgClasses(th)).toEqual(['bg-muted'])
    expect(bgClasses(menuEl())).toEqual(['bg-inherit'])
  })

  it('cabecera transparente: toda la cadena hereda y el botón no tiene fondo propio', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} {...menuProps} />)
    const th = menuEl().closest('th')!
    expect(bgClasses(menuEl())).toEqual(['bg-inherit'])
    expect(bgClasses(th)).toEqual(['bg-inherit'])
    expect(bgClasses(th.closest('tr')!)).toEqual(['bg-inherit'])
    expect(bgClasses(th.closest('thead')!)).toEqual(['bg-inherit'])
  })

  it('cabecera fija: la <th> lleva el fondo opaco por variable (tarjeta o `--list-head-bg`) y el botón lo hereda', () => {
    render(
      <ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} stickyHeader {...menuProps} />,
    )
    const th = menuEl().closest('th')!
    expect(th.className).toContain('var(--list-head-bg')
    expect(th.className).not.toMatch(/(^|\s)bg-background(\s|$)/)
    expect(bgClasses(menuEl())).toEqual(['bg-inherit'])
    // La raíz pasa a `--color-card` sola dentro de un `.bg-card`.
    expect(container.querySelector('.\\@container')!.className).toContain(
      '[.bg-card_&]:[--list-auto-head-bg:var(--color-card)]',
    )
  })
})

describe('ResponsiveList (v0.8.0: ready)', () => {
  it('con ready=false pinta un esqueleto aria-busy en vez de la tabla con anchos por defecto', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} ready={false} />)
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('[aria-busy="true"][data-list-pending]')).not.toBeNull()
  })

  it('por defecto (sin ready) pinta la tabla como siempre', () => {
    render(<ResponsiveList columns={columns} data={rows} rowKey={(r) => r.id} />)
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('[data-list-pending]')).toBeNull()
  })
})

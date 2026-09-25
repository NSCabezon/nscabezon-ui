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

  it('con los dos callbacks pinta la columna del menú al final, sticky y solo en la tabla', () => {
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
    // Cabecera: las visibles (id oculta) + la del menú, que va la última.
    const th = heads()
    expect(th).toHaveLength(3)
    const menuHead = th[th.length - 1]
    expect(menuHead.querySelector('button')).not.toBeNull()
    // Nombre accesible de la columna (el botón es solo un icono).
    expect(menuHead.querySelector('.sr-only')).not.toBeNull()
    // Pegada al borde derecho: con `resizable` la tabla scrollea a lo ancho.
    expect(menuHead.className).toContain('sticky')
    expect(menuHead.getAttribute('style')).toContain('right: 0')
    // No ordena ni se puede ocultar a sí misma: ni aria-sort ni entrada propia.
    expect(menuHead.hasAttribute('aria-sort')).toBe(false)

    // Cuerpo: una celda vacía por fila, para que cuadre con la cabecera.
    for (const tr of Array.from(table().querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'))
      expect(cells).toHaveLength(3)
      expect(cells[cells.length - 1].textContent).toBe('')
    }

    // Móvil (cards) con `mobileColumnsMenu={false}` (lista con ListFooter):
    // ni menú ni rastro de la columna.
    expect(mobileMenu()).toBeNull()
    for (const card of cards()) expect(card.querySelector('button')).toBeNull()
  })

  it('la columna del menú entra en el colgroup sin asa de redimensión', () => {
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
    // 3 columnas de datos + la del menú, con ancho fijo propio.
    const cols = Array.from(table().querySelectorAll('colgroup > col'))
    expect(cols).toHaveLength(4)
    expect(cols[3].getAttribute('style')).toContain('44px')
    // El asa sigue estando en todas menos la última columna de DATOS; la del
    // menú no se redimensiona.
    const handles = heads().map((th) => th.querySelector('.cursor-col-resize'))
    expect(handles.map(Boolean)).toEqual([true, true, false, false])
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
    expect(cols[0].hasAttribute('style')).toBe(false)
    const handles = heads().map((th) => th.querySelector('.cursor-col-resize'))
    expect(handles.map(Boolean)).toEqual([true, true, false])
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

  it('resizable: una columna action sin cabecera cae al ancho compacto por defecto, una CON cabecera no, y la primary sin `width` absorbe el sobrante', () => {
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
    // `name` es primary y no lleva `width`: sigue sin <col> width, absorbe el sobrante.
    expect(cols[0].hasAttribute('style')).toBe(false)
    // `remove` es action SIN cabecera y sin ancho propio: ancho compacto por defecto.
    expect(cols[3].getAttribute('style')).toContain('56px')
    // `quote` es action CON cabecera (botón con texto): sin `width` propio se
    // queda sin <col> width, igual que cualquier columna de datos — 56px la
    // habría recortado (ver BikesListPage: «Presupuesto de venta» → «enta»).
    expect(cols[4].hasAttribute('style')).toBe(false)
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
    expect(menuHead().querySelector('.sr-only')!.textContent).toBe('Columns')
    expect(menuHead().querySelector('button')!.getAttribute('aria-label')).toBe('Columns')
    render(ui({ columnsMenu: 'Spalten' }))
    expect(menuHead().querySelector('.sr-only')!.textContent).toBe('Spalten')
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
    expect(heads()[heads().length - 1].querySelector('.sr-only')!.textContent).toBe('Columnas')
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

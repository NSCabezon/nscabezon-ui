// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { QueryClientProvider } from '@tanstack/react-query'

import type { ListSort } from '../prefs/listPrefs'
import { __resetListPrefsCache } from '../prefs/useListPrefs'
import { resolveListDefaults, useListView, type UnpaginatedListView } from './useListView'
import { rowTone } from './rowTone'
import { makeQueryClient } from '../test/utils'

// Con el `useListPrefs` REAL y el almacén por defecto (solo local): lo que se
// prueba es cómo el hook orquesta preferencias + paginación.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type View = ReturnType<typeof useListView>
const COLUMN_KEYS = ['number', 'client', 'status'] as const
const SORT: ListSort = { key: 'number', dir: 'desc' }

let container: HTMLDivElement
let root: Root
let latest: View
const queryClient = makeQueryClient()

// El harness publica el valor del hook tras cada commit (efecto sin deps);
// `act` vacía los efectos, así que `latest` está al día al salir de cada act.
// `filter` hace de dep externa (una pestaña, una búsqueda): el test la cambia
// re-renderizando con otra prop.
function Harness({
  pageSize,
  filter,
  report,
}: {
  pageSize?: number
  filter: string
  report: (view: View) => void
}) {
  const view = useListView('test-list', {
    columnKeys: COLUMN_KEYS,
    defaults: { sort: SORT, pageSize },
    deps: [filter],
  })
  React.useEffect(() => {
    report(view)
  })
  return null
}

function mount(props: { pageSize?: number; filter?: string } = {}) {
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Harness
          filter="open"
          {...props}
          report={(view) => {
            latest = view
          }}
        />
      </QueryClientProvider>,
    )
  })
}

beforeEach(() => {
  localStorage.clear()
  __resetListPrefsCache()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('resolveListDefaults', () => {
  it('fills the optional fields: no hidden, no widths, 25 per page, not compact', () => {
    expect(resolveListDefaults({ sort: SORT })).toEqual({
      hidden: [],
      widths: {},
      sort: SORT,
      pageSize: 25,
      compact: false,
      order: [],
    })
    expect(
      resolveListDefaults({ sort: null, hidden: ['a'], widths: { a: 90 }, pageSize: 10 }),
    ).toEqual({
      hidden: ['a'],
      widths: { a: 90 },
      sort: null,
      pageSize: 10,
      compact: false,
      order: [],
    })
  })
})

describe('useListView', () => {
  it('starts on page 1 with the defaults and wires the two prop bundles', () => {
    mount()
    expect(latest.page).toBe(1)
    expect(latest.pageSize).toBe(25)
    expect(latest.sort).toEqual(SORT)
    expect(latest.from).toBe(0)
    expect(latest.to).toBe(24)

    expect(latest.listProps).toMatchObject({
      sort: SORT,
      resizable: true,
      stickyHeader: true,
      columnWidths: {},
      hiddenColumns: [],
      // Paginado = con `ListFooter`, que ya pinta el menú de columnas en móvil.
      mobileColumnsMenu: false,
    })
    expect(typeof latest.listProps.onSortChange).toBe('function')
    expect(typeof latest.listProps.onColumnWidthsChange).toBe('function')
    // El menú de columnas lo pinta `ResponsiveList` en su cabecera: sus dos
    // callbacks viajan en `listProps`, así que las páginas no pasan nada.
    expect(typeof latest.listProps.onHiddenColumnsChange).toBe('function')
    expect(typeof latest.listProps.onColumnsReset).toBe('function')
    expect(latest.footerProps).toMatchObject({ hidden: [], page: 1, pageSize: 25 })
    expect(latest.footerProps.onPageChange).toBe(latest.setPage)
    expect(typeof latest.footerProps.onHiddenChange).toBe('function')
    expect(typeof latest.footerProps.onReset).toBe('function')
    expect(typeof latest.footerProps.onPageSizeChange).toBe('function')
  })

  it('honours a different default page size and the range follows the page', () => {
    mount({ pageSize: 10 })
    expect(latest.pageSize).toBe(10)
    act(() => latest.setPage(3))
    expect(latest.page).toBe(3)
    expect(latest.from).toBe(20)
    expect(latest.to).toBe(29)
  })

  it('changing the page size goes back to page 1 with the new range', () => {
    mount()
    act(() => latest.setPage(2))
    expect(latest.from).toBe(25)
    act(() => latest.footerProps.onPageSizeChange(50))
    expect(latest.page).toBe(1)
    expect(latest.pageSize).toBe(50)
    expect(latest.from).toBe(0)
    expect(latest.to).toBe(49)
    expect(latest.footerProps.pageSize).toBe(50)
  })

  it('v0.7.0: pageSize/onPageSizeChange viajan en listProps (menú de la cabecera) y en footerProps; cambiarlo vuelve a la página 1', () => {
    mount()
    expect(latest.listProps.pageSize).toBe(25)
    expect(latest.footerProps.pageSize).toBe(25)
    expect(latest.listProps.onPageSizeChange).toBe(latest.footerProps.onPageSizeChange)
    act(() => latest.setPage(3))
    act(() => latest.listProps.onPageSizeChange!(100))
    expect(latest.page).toBe(1)
    expect(latest.pageSize).toBe(100)
    expect(latest.listProps.pageSize).toBe(100)
    expect(latest.footerProps.pageSize).toBe(100)
  })

  it('changing the sort or a dep goes back to page 1', () => {
    mount()
    act(() => latest.setPage(2))
    act(() => latest.listProps.onSortChange({ key: 'client', dir: 'asc' }))
    expect(latest.page).toBe(1)
    expect(latest.sort).toEqual({ key: 'client', dir: 'asc' })
    expect(latest.listProps.sort).toEqual({ key: 'client', dir: 'asc' })

    act(() => latest.setPage(2))
    mount({ filter: 'closed' })
    expect(latest.page).toBe(1)
  })

  it('hidden columns and widths flow to listProps/footerProps; reset clears them but keeps size and sort', () => {
    mount()
    act(() => latest.footerProps.onPageSizeChange(10))
    act(() => latest.listProps.onSortChange({ key: 'status', dir: 'asc' }))
    // Ocultar desde la cabecera (escritorio) y desde el pie (móvil) es lo mismo.
    act(() => latest.listProps.onHiddenColumnsChange(['client']))
    act(() => latest.listProps.onColumnWidthsChange({ number: 80 }))
    expect(latest.listProps.hiddenColumns).toEqual(['client'])
    expect(latest.footerProps.hidden).toEqual(['client'])
    expect(latest.listProps.columnWidths).toEqual({ number: 80 })
    act(() => latest.footerProps.onHiddenChange(['client', 'status']))
    expect(latest.listProps.hiddenColumns).toEqual(['client', 'status'])

    act(() => latest.listProps.onColumnsReset())
    expect(latest.listProps.hiddenColumns).toEqual([])
    expect(latest.listProps.columnWidths).toEqual({})
    expect(latest.pageSize).toBe(10)
    expect(latest.sort).toEqual({ key: 'status', dir: 'asc' })
  })

  it('keeps stable prop bundles across renders that do not touch them', () => {
    mount()
    const before = latest.listProps
    act(() => latest.setPage(2))
    expect(latest.listProps).toBe(before)
  })
})

describe('useListView (paginated: false)', () => {
  it('returns only the list bundle, without page, range or footer props', () => {
    let view: UnpaginatedListView | undefined
    function Plain() {
      const v = useListView('plain-list', {
        columnKeys: COLUMN_KEYS,
        defaults: { sort: null },
        paginated: false,
        stickyHeader: false,
      })
      React.useEffect(() => {
        view = v
      })
      return null
    }
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Plain />
        </QueryClientProvider>,
      )
    })
    expect(view!.listProps).toMatchObject({
      sort: null,
      stickyHeader: false,
      resizable: true,
      // Sin pie: el menú de columnas va encima de las tarjetas en móvil.
      mobileColumnsMenu: true,
    })
    expect('footerProps' in view!).toBe(false)
    expect('page' in view!).toBe(false)
    // Sin paginación no hay tamaño de página que ofrecer en el menú.
    expect('pageSize' in view!.listProps).toBe(false)
    expect('onPageSizeChange' in view!.listProps).toBe(false)
  })
})

describe('useListView (compactable)', () => {
  function mountWith(options: { compactable?: boolean }, key = 'compact-list') {
    let view: View | undefined
    function H() {
      const v = useListView(key, {
        columnKeys: COLUMN_KEYS,
        defaults: { sort: SORT },
        ...options,
      })
      React.useEffect(() => {
        view = v
      })
      return null
    }
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <H />
        </QueryClientProvider>,
      )
    })
    return () => view!
  }

  it('sin `compactable` no hay compact en listProps ni footerProps (sin casilla) y compact es false', () => {
    localStorage.setItem('list-prefs:compact-list', JSON.stringify({ compact: true }))
    const view = mountWith({})
    expect('compact' in view().listProps).toBe(false)
    expect('onCompactChange' in view().listProps).toBe(false)
    expect('compact' in view().footerProps).toBe(false)
    expect('onCompactChange' in view().footerProps).toBe(false)
    // Aunque haya uno guardado, un listado no compactable nunca va en compacto.
    expect(view().compact).toBe(false)
  })

  it('con `compactable` cablea compact + onCompactChange en los dos paquetes y lo persiste', () => {
    const view = mountWith({ compactable: true })
    expect(view().compact).toBe(false)
    expect(view().listProps.compact).toBe(false)
    expect(view().footerProps.compact).toBe(false)
    act(() => view().listProps.onCompactChange!(true))
    expect(view().compact).toBe(true)
    expect(view().listProps.compact).toBe(true)
    expect(view().footerProps.compact).toBe(true)
    expect(JSON.parse(localStorage.getItem('list-prefs:compact-list')!).compact).toBe(true)
    // «Restablecer columnas» no lo toca.
    act(() => view().listProps.onColumnsReset())
    expect(view().compact).toBe(true)
    act(() => view().footerProps.onCompactChange!(false))
    expect(view().compact).toBe(false)
  })

  it('cablea columnOrder + onColumnOrderChange en los dos paquetes (sin opt-in), expone `order` y el reset lo vacía', () => {
    const view = mountWith({})
    expect(view().order).toEqual([])
    expect(view().listProps.columnOrder).toEqual([])
    expect(view().footerProps.columnOrder).toEqual([])
    act(() => view().listProps.onColumnOrderChange(['status', 'number', 'client']))
    expect(view().order).toEqual(['status', 'number', 'client'])
    expect(view().listProps.columnOrder).toEqual(['status', 'number', 'client'])
    expect(view().footerProps.columnOrder).toEqual(['status', 'number', 'client'])
    expect(JSON.parse(localStorage.getItem('list-prefs:compact-list')!).order).toEqual([
      'status',
      'number',
      'client',
    ])
    act(() => view().footerProps.onColumnOrderChange!(['client', 'number', 'status']))
    expect(view().order).toEqual(['client', 'number', 'status'])
    // «Restablecer columnas» vuelve al orden de serie.
    act(() => view().listProps.onColumnsReset())
    expect(view().order).toEqual([])
  })
})

describe('useListView (persistencia local)', () => {
  it('writes the prefs to localStorage under list-prefs:<key>', () => {
    mount()
    act(() => latest.listProps.onHiddenColumnsChange(['client']))
    expect(JSON.parse(localStorage.getItem('list-prefs:test-list')!)).toMatchObject({
      hidden: ['client'],
      sort: SORT,
      pageSize: 25,
    })
  })
})

describe('rowTone', () => {
  it('returns the three CSS variables with the shared intensities', () => {
    expect(rowTone('#ff0000')).toEqual({
      '--row-accent': '#ff0000',
      '--row-tint': 'color-mix(in oklab, #ff0000 12%, transparent)',
      '--row-tint-hover': 'color-mix(in oklab, #ff0000 22%, transparent)',
    })
  })
})

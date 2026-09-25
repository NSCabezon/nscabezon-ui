// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ListFooter } from './ListFooter'
import type { ColumnsMenuColumn } from './columns-menu'
import { UiProvider } from '../context/UiProvider'

// El pie del listado sustituye a la fila de toolbar que iba ENCIMA de cada
// listado (costaba ~40px de alto en los ~40 listados). Reglas que fija esta
// prueba: la fila se pinta siempre, la navegación solo si hay más de una
// página, y el menú de columnas solo en móvil (en escritorio va incrustado en
// la cabecera de la tabla). Sin @testing-library: react-dom + act sobre jsdom.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const columns: ColumnsMenuColumn[] = [
  { key: 'name', header: 'Nombre', primary: true },
  { key: 'total', header: 'Total' },
]

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderFooter(props: Partial<React.ComponentProps<typeof ListFooter>> = {}) {
  act(() => {
    root.render(
      <ListFooter
        page={1}
        pageSize={25}
        total={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        hidden={[]}
        onHiddenChange={() => {}}
        onReset={() => {}}
        columns={columns}
        {...props}
      />,
    )
  })
}

// La navegación es lo que pinta `Pagination`: su fila usa `gap-1`, distinto
// del `gap-2` del bloque contenedor y del grupo de la derecha.
const nav = () => container.querySelector('.gap-1')
const pageSizeTrigger = () => container.querySelector<HTMLElement>('[role="combobox"]')!
// El menú de columnas: el único botón que no es el disparador del selector.
const columnsButton = () =>
  Array.from(container.querySelectorAll('button')).find(
    (b) => b.getAttribute('role') !== 'combobox',
  )

// El texto de total que pinta ListFooter cuando Pagination no pinta nada
// (una sola página). No confundir con el rango que pinta la propia
// Pagination (`nav() span.tabular-nums`).
// La fila real: el nodo externo solo lleva el `@container` (los cortes del pie
// son de contenedor, así que la fila tiene que ser un hijo suyo).
const row = () => container.firstElementChild!.firstElementChild!

const countText = () =>
  Array.from(container.querySelectorAll('span.tabular-nums')).find((s) => !nav()?.contains(s))

describe('ListFooter', () => {
  it('con una sola página no pinta navegación, pero sí el selector de filas y el total', () => {
    renderFooter({ total: 10, pageSize: 25 })
    expect(nav()).toBeNull()
    // La fila se pinta igual (homogeneiza el alto de todos los listados).
    expect(row().className).toContain('flex')
    expect(pageSizeTrigger()).not.toBeNull()
    expect(pageSizeTrigger().textContent).toContain('25')
    // El recuento tiene que verse SIEMPRE, aunque no haya navegación.
    expect(countText()!.textContent).toBe('10 resultados')
  })

  it('con más de una página pinta la navegación y el rango, no el total suelto', () => {
    renderFooter({ total: 60, pageSize: 25, page: 2 })
    expect(nav()).not.toBeNull()
    // Primera / anterior / siguiente / última + el texto del rango.
    const buttons = Array.from(nav()!.querySelectorAll('button'))
    expect(buttons).toHaveLength(4)
    // En la página 2 de 3 se puede ir en las dos direcciones.
    expect(buttons.map((b) => b.hasAttribute('disabled'))).toEqual([false, false, false, false])
    expect(nav()!.querySelector('span.tabular-nums')).not.toBeNull()
    // El total suelto solo aparece cuando Pagination no pinta nada.
    expect(countText()).toBeUndefined()
  })

  it('con 0 resultados no pinta ni navegación ni el total suelto (lo cubre el EmptyState de la página)', () => {
    renderFooter({ total: 0, pageSize: 25 })
    expect(nav()).toBeNull()
    expect(countText()).toBeUndefined()
  })

  it('el selector va el último (trailing) y conserva su etiqueta accesible', () => {
    renderFooter({ total: 60 })
    const trailing = row().lastElementChild!
    expect(trailing.lastElementChild).toBe(pageSizeTrigger().closest('[role="combobox"]'))
    expect(pageSizeTrigger().hasAttribute('aria-label')).toBe(true)
  })

  it('el menú de columnas del pie es solo para móvil', () => {
    renderFooter()
    const button = columnsButton()!
    expect(button).toBeDefined()
    // En escritorio el menú vive en la cabecera de la tabla: aquí se esconde,
    // con el mismo corte de contenedor que usa ResponsiveList para las cards.
    expect(container.firstElementChild!.className).toContain('@container')
    expect(button.className).toContain('@3xl:hidden')
  })

  it('con loading pinta el spinner junto a la paginación, con aria-live y texto sr-only', () => {
    renderFooter({ total: 60, loading: true })
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeNull()
    expect(spinner!.closest('[aria-live="polite"]')).not.toBeNull()
    expect(container.querySelector('.sr-only')).not.toBeNull()
  })

  // A11Y-9 (auditoría 23/09): el resultado de buscar/filtrar se anuncia.
  it('anuncia el recuento en una región status que existe siempre, también con 0', () => {
    const status = () => container.querySelector('[role="status"]')
    renderFooter({ total: 10 })
    expect(status()!.textContent).toBe('10 resultados')
    renderFooter({ total: 1 })
    expect(status()!.textContent).toBe('1 resultado')
    renderFooter({ total: 60 })
    expect(status()!.textContent).toBe('60 resultados')
    renderFooter({ total: 60, truncated: true })
    expect(status()!.textContent).toBe('solo los primeros 60 resultados')
    renderFooter({ total: 0 })
    expect(status()!.textContent).toBe('Sin resultados')
    expect(status()!.className).toContain('sr-only')
  })

  it('sin loading no pinta el spinner, pero el hueco (`aria-live`) sigue en el DOM', () => {
    renderFooter({ total: 60, loading: false })
    expect(container.querySelector('.animate-spin')).toBeNull()
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('el clamp de página sigue vivo aunque no haya navegación', () => {
    const onPageChange = vi.fn<(page: number) => void>()
    // El total encoge (borrado/archivado) y la página actual queda fuera de
    // rango: sin controles a la vista, `Pagination` tiene que devolver a la 1.
    renderFooter({ total: 5, pageSize: 25, page: 3, onPageChange })
    expect(nav()).toBeNull()
    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})

// --- Cortes de contenedor, lista vacía y truncado ----------------------

// El botón del menú de columnas, sin confundirlo con las flechas de
// `Pagination` (que tampoco son `combobox`).
const menuButton = () =>
  Array.from(container.querySelectorAll('button')).find(
    (b) => b.getAttribute('role') !== 'combobox' && !nav()?.contains(b),
  )

// Todas las clases (incluidas las de los hijos) del subárbol del pie.
const allClasses = () =>
  [container.firstElementChild!, ...container.querySelectorAll<Element>('*')].flatMap((el) =>
    Array.from(el.classList),
  )

describe('ListFooter (auditoría 06/09)', () => {
  it('L1: los cortes del pie son de contenedor, nunca de viewport', () => {
    renderFooter({ total: 60 })
    const wrapper = container.firstElementChild!
    // El `@container` va en un envoltorio SIN estilos de layout: un elemento no
    // puede consultarse a sí mismo, así que la fila tiene que ser un hijo.
    expect(wrapper.className).toContain('@container')
    expect(wrapper.className).not.toMatch(/(^|[\s:])(flex|grid)(\b|$)/)
    expect(row().className).toContain('flex')
    expect(row().className).toContain('@2xl:grid')
    // Ni un solo corte de viewport en todo el pie (era `sm:` y se cortaba el
    // selector en un panel estrecho con la ventana ancha).
    expect(allClasses().filter((c) => /^(sm|md|lg|xl|2xl):/.test(c))).toEqual([])
  })

  it('L1: la etiqueta larga del selector también conmuta por contenedor', () => {
    renderFooter({ total: 60 })
    const trigger = pageSizeTrigger()
    const labels = Array.from(trigger.querySelectorAll('span'))
    expect(labels.some((s) => s.className.includes('@md:hidden'))).toBe(true)
    expect(labels.some((s) => s.className.includes('@md:inline'))).toBe(true)
  })

  it('L2/L8: con 0 resultados el pie enseña el menú de columnas a cualquier ancho y esconde el selector', () => {
    renderFooter({ total: 0 })
    // No hay tabla donde incrustar el menú de escritorio: el pie es el único
    // sitio desde el que llegar a «Restablecer columnas».
    const button = menuButton()
    expect(button).toBeDefined()
    expect(button!.className).not.toContain('@3xl:hidden')
    // El selector de filas por página no gobierna nada visible.
    expect(container.querySelector('[role="combobox"]')).toBeNull()
  })

  it('L2/L8: con resultados vuelve el selector y el menú se repliega al corte de contenedor', () => {
    renderFooter({ total: 60 })
    expect(container.querySelector('[role="combobox"]')).not.toBeNull()
    expect(menuButton()!.className).toContain('@3xl:hidden')
  })

  it('L2/L8: con 0 resultados Pagination sigue montada (auto-clamp)', () => {
    const onPageChange = vi.fn<(page: number) => void>()
    renderFooter({ total: 0, pageSize: 25, page: 4, onPageChange })
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('G-4: con la marca de truncado el rango dice «primeros N», no el total', () => {
    renderFooter({ total: 100, pageSize: 25, page: 1, truncated: true })
    expect(nav()!.querySelector('span.tabular-nums')!.textContent).toBe('1–25 de los primeros 100')
  })

  it('G-4: sin navegación, el recuento truncado también lo dice', () => {
    renderFooter({ total: 100, pageSize: 100, truncated: true })
    expect(nav()).toBeNull()
    expect(countText()!.textContent).toBe('solo los primeros 100 resultados')
  })

  it('G-4: sin la marca, el texto es el de siempre', () => {
    renderFooter({ total: 100, pageSize: 25, page: 1 })
    expect(nav()!.querySelector('span.tabular-nums')!.textContent).toBe('1–25 de 100')
  })
})

describe('ListFooter (textos)', () => {
  it('los textos salen del UiProvider y la prop `labels` gana', () => {
    act(() => {
      root.render(
        <UiProvider
          labels={{
            paginationRange: (from, to, total) => `${from}-${to} of ${total}`,
            count: (n) => `${n} results`,
            pageSizeLabel: 'Rows per page',
          }}
        >
          <ListFooter
            page={1}
            pageSize={25}
            total={60}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            hidden={[]}
            onHiddenChange={() => {}}
            onReset={() => {}}
            columns={columns}
            labels={{ pageSizeLabel: 'Filas' }}
          />
        </UiProvider>,
      )
    })
    expect(nav()!.querySelector('span.tabular-nums')!.textContent).toBe('1-25 of 60')
    expect(container.querySelector('[role="status"]')!.textContent).toBe('60 results')
    expect(pageSizeTrigger().getAttribute('aria-label')).toBe('Filas')
    expect(pageSizeTrigger().textContent).toContain('25 por página')
  })
})

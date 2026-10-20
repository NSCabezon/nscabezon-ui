// @vitest-environment jsdom
import * as React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ColumnsMenu, type ColumnsMenuColumn } from './columns-menu'
import { UiProvider } from '../context/UiProvider'

// Casilla «Modo compacto» del menú de columnas: opt-in (solo con
// `onCompactChange`), alterna sin cerrar el menú (como las casillas de
// columnas) y «Restablecer columnas» no la toca.

const columns: ColumnsMenuColumn[] = [
  { key: 'name', header: 'Nombre', primary: true },
  { key: 'total', header: 'Total' },
]

afterEach(cleanup)

// Radix abre el DropdownMenu con teclado (Enter) en jsdom; el pointerdown
// necesita APIs de puntero que jsdom no trae.
function openMenu() {
  const trigger = screen.getByRole('button', { name: 'Columnas' })
  act(() => {
    fireEvent.keyDown(trigger, { key: 'Enter' })
  })
}

function Harness({
  initialCompact = false,
  onCompactChange,
  onReset = () => {},
  withCompact = true,
}: {
  initialCompact?: boolean
  onCompactChange?: (v: boolean) => void
  onReset?: () => void
  withCompact?: boolean
}) {
  const [compact, setCompact] = React.useState(initialCompact)
  return (
    <ColumnsMenu
      columns={columns}
      hidden={[]}
      onHiddenChange={() => {}}
      onReset={onReset}
      {...(withCompact
        ? {
            compact,
            onCompactChange: (v: boolean) => {
              setCompact(v)
              onCompactChange?.(v)
            },
          }
        : {})}
    />
  )
}

const compactItem = () => screen.queryByRole('menuitemcheckbox', { name: 'Modo compacto' })

describe('ColumnsMenu — modo compacto', () => {
  it('sin `onCompactChange` no hay casilla de compacto', () => {
    render(<Harness withCompact={false} />)
    openMenu()
    expect(screen.getAllByRole('menuitemcheckbox').map((el) => el.textContent)).toEqual([
      'Nombre',
      'Total',
    ])
    expect(compactItem()).toBeNull()
  })

  it('con `onCompactChange` pinta «Modo compacto» encima de «Restablecer columnas»', () => {
    render(<Harness />)
    openMenu()
    const item = compactItem()!
    expect(item).not.toBeNull()
    expect(item.getAttribute('aria-checked')).toBe('false')
    const reset = screen.getByRole('menuitem', { name: 'Restablecer columnas' })
    // Orden en el documento: la casilla va antes que el reset.
    expect(item.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('alterna el modo y no cierra el menú', () => {
    const onCompactChange = vi.fn()
    render(<Harness onCompactChange={onCompactChange} />)
    openMenu()
    act(() => {
      fireEvent.click(compactItem()!)
    })
    expect(onCompactChange).toHaveBeenLastCalledWith(true)
    // Sigue abierto y marcado.
    expect(compactItem()).not.toBeNull()
    expect(compactItem()!.getAttribute('aria-checked')).toBe('true')
    act(() => {
      fireEvent.click(compactItem()!)
    })
    expect(onCompactChange).toHaveBeenLastCalledWith(false)
    expect(compactItem()!.getAttribute('aria-checked')).toBe('false')
  })

  it('«Restablecer columnas» no toca el modo compacto', () => {
    const onCompactChange = vi.fn()
    const onReset = vi.fn()
    render(<Harness initialCompact onCompactChange={onCompactChange} onReset={onReset} />)
    openMenu()
    expect(compactItem()!.getAttribute('aria-checked')).toBe('true')
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Restablecer columnas' }))
    })
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onCompactChange).not.toHaveBeenCalled()
    openMenu()
    expect(compactItem()!.getAttribute('aria-checked')).toBe('true')
  })

  it('el texto sale de `labels.compactMode` (UiProvider y prop)', () => {
    render(
      <UiProvider labels={{ compactMode: 'Compact mode' }}>
        <Harness />
      </UiProvider>,
    )
    openMenu()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Compact mode' })).not.toBeNull()
  })
})

describe('ColumnsMenu — orden de columnas', () => {
  const orderColumnsDef: ColumnsMenuColumn[] = [
    { key: 'name', header: 'Nombre', primary: true },
    { key: 'total', header: <span>Total</span> },
    { key: 'client', header: 'Cliente' },
    { key: 'menu', action: true },
    { key: 'quote', header: 'Presupuesto', action: true },
  ]

  function OrderHarness({
    initial = [],
    onOrder,
  }: {
    initial?: string[]
    onOrder?: (order: string[]) => void
  }) {
    const [order, setOrder] = React.useState(initial)
    return (
      <ColumnsMenu
        columns={orderColumnsDef}
        hidden={[]}
        onHiddenChange={() => {}}
        onReset={() => {}}
        columnOrder={order}
        onColumnOrderChange={(next) => {
          setOrder(next)
          onOrder?.(next)
        }}
      />
    )
  }
  const names = () => screen.getAllByRole('menuitemcheckbox').map((el) => el.textContent)
  const moveItem = (name: string) => screen.getByRole('menuitem', { name })
  const isDisabled = (el: HTMLElement) => el.hasAttribute('data-disabled')

  it('sin `onColumnOrderChange` no hay botones Subir/Bajar, pero la lista sigue el orden', () => {
    render(
      <ColumnsMenu
        columns={orderColumnsDef}
        hidden={[]}
        onHiddenChange={() => {}}
        onReset={() => {}}
        columnOrder={['client', 'name', 'total']}
      />,
    )
    openMenu()
    expect(names()).toEqual(['Cliente', 'Nombre', 'Total', 'Presupuesto'])
    expect(screen.queryByRole('menuitem', { name: /^Subir/ })).toBeNull()
  })

  it('pinta la lista en el orden actual, Subir/Bajar con el nombre y deshabilitados en los extremos', () => {
    render(<OrderHarness initial={['client', 'name', 'total']} />)
    openMenu()
    expect(names()).toEqual(['Cliente', 'Nombre', 'Total', 'Presupuesto'])
    expect(isDisabled(moveItem('Subir Cliente'))).toBe(true)
    expect(isDisabled(moveItem('Bajar Cliente'))).toBe(false)
    expect(isDisabled(moveItem('Subir Total'))).toBe(false)
    // Cabecera como nodo: el nombre sale de su texto.
    expect(isDisabled(moveItem('Bajar Total'))).toBe(true)
    // Las `action` no se mueven.
    expect(screen.queryByRole('menuitem', { name: 'Subir Presupuesto' })).toBeNull()
  })

  it('subir y bajar reordenan sin cerrar el menú', () => {
    const onOrder = vi.fn()
    render(<OrderHarness onOrder={onOrder} />)
    openMenu()
    expect(names()).toEqual(['Nombre', 'Total', 'Cliente', 'Presupuesto'])
    act(() => {
      fireEvent.click(moveItem('Subir Cliente'))
    })
    expect(onOrder).toHaveBeenLastCalledWith(['name', 'client', 'total', 'menu', 'quote'])
    // Sigue abierto y ya en el orden nuevo.
    expect(names()).toEqual(['Nombre', 'Cliente', 'Total', 'Presupuesto'])
    act(() => {
      fireEvent.click(moveItem('Bajar Nombre'))
    })
    expect(onOrder).toHaveBeenLastCalledWith(['client', 'name', 'total', 'menu', 'quote'])
    expect(names()).toEqual(['Cliente', 'Nombre', 'Total', 'Presupuesto'])
    // Un extremo deshabilitado no hace nada.
    onOrder.mockClear()
    act(() => {
      fireEvent.click(moveItem('Subir Cliente'))
    })
    expect(onOrder).not.toHaveBeenCalled()
  })

  it('los textos salen de `labels.columnMoveUp/Down` (con el nombre interpolado)', () => {
    render(
      <UiProvider
        labels={{ columnMoveUp: (c) => `Move ${c} up`, columnMoveDown: (c) => `Move ${c} down` }}
      >
        <OrderHarness />
      </UiProvider>,
    )
    openMenu()
    expect(moveItem('Move Total up')).not.toBeNull()
    expect(moveItem('Move Total down')).not.toBeNull()
  })
})

describe('ColumnsMenu — filas por página (v0.7.0)', () => {
  function PageSizeHarness({
    onPageSizeChange,
    withPageSize = true,
    onCompactChange,
  }: {
    onPageSizeChange?: (n: number) => void
    withPageSize?: boolean
    onCompactChange?: (v: boolean) => void
  }) {
    const [pageSize, setPageSize] = React.useState(25)
    const [compact, setCompact] = React.useState(false)
    const [order, setOrder] = React.useState<string[]>([])
    return (
      <ColumnsMenu
        columns={columns}
        hidden={[]}
        onHiddenChange={() => {}}
        onReset={() => {}}
        compact={compact}
        onCompactChange={(v) => {
          setCompact(v)
          onCompactChange?.(v)
        }}
        columnOrder={order}
        onColumnOrderChange={setOrder}
        {...(withPageSize
          ? {
              pageSize,
              onPageSizeChange: (n: number) => {
                setPageSize(n)
                onPageSizeChange?.(n)
              },
            }
          : {})}
      />
    )
  }

  const subTrigger = () => screen.queryByRole('menuitem', { name: 'Filas por página' })
  function openSub() {
    act(() => {
      fireEvent.keyDown(subTrigger()!, { key: 'ArrowRight' })
    })
  }

  it('sin `onPageSizeChange` no hay submenú', () => {
    render(<PageSizeHarness withPageSize={false} />)
    openMenu()
    expect(subTrigger()).toBeNull()
  })

  it('con la prop, el submenú va entre «Modo compacto» y «Restablecer columnas»', () => {
    render(<PageSizeHarness />)
    openMenu()
    const sub = subTrigger()!
    expect(sub.getAttribute('aria-haspopup')).toBe('menu')
    expect(sub.getAttribute('aria-expanded')).toBe('false')
    const compact = screen.getByRole('menuitemcheckbox', { name: 'Modo compacto' })
    const reset = screen.getByRole('menuitem', { name: 'Restablecer columnas' })
    expect(compact.compareDocumentPosition(sub) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(sub.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Separador justo antes del submenú (y otro antes del reset).
    expect(sub.previousElementSibling?.getAttribute('role')).toBe('separator')
    expect(reset.previousElementSibling?.getAttribute('role')).toBe('separator')
  })

  it('→ abre el submenú: 10 · 25 · 50 · 100 con el actual marcado', () => {
    render(<PageSizeHarness />)
    openMenu()
    openSub()
    expect(subTrigger()!.getAttribute('aria-expanded')).toBe('true')
    const radios = screen.getAllByRole('menuitemradio')
    expect(radios.map((r) => r.textContent)).toEqual(['10', '25', '50', '100'])
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ])
    // ← lo cierra y devuelve el foco al disparador (navegación de Radix).
    act(() => {
      fireEvent.keyDown(screen.getByRole('menu', { name: 'Filas por página' }), {
        key: 'ArrowLeft',
      })
    })
    expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
  })

  it('un toque (click) en el disparador también abre el submenú', () => {
    render(<PageSizeHarness />)
    openMenu()
    act(() => {
      fireEvent.click(subTrigger()!)
    })
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(4)
  })

  it('elegir un tamaño llama a `onPageSizeChange` con el número (Enter también)', () => {
    const onPageSizeChange = vi.fn()
    render(<PageSizeHarness onPageSizeChange={onPageSizeChange} />)
    openMenu()
    openSub()
    act(() => {
      fireEvent.click(screen.getByRole('menuitemradio', { name: '50' }))
    })
    expect(onPageSizeChange).toHaveBeenLastCalledWith(50)
    openMenu()
    openSub()
    expect(screen.getByRole('menuitemradio', { name: '50' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    act(() => {
      fireEvent.keyDown(screen.getByRole('menuitemradio', { name: '10' }), { key: 'Enter' })
    })
    expect(onPageSizeChange).toHaveBeenLastCalledWith(10)
  })

  it('no rompe compacto ni Subir/Bajar', () => {
    const onCompactChange = vi.fn()
    render(<PageSizeHarness onCompactChange={onCompactChange} />)
    openMenu()
    act(() => {
      fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Modo compacto' }))
    })
    expect(onCompactChange).toHaveBeenCalledWith(true)
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Bajar Nombre' }))
    })
    expect(screen.getAllByRole('menuitemcheckbox').slice(0, 2).map((el) => el.textContent)).toEqual([
      'Total',
      'Nombre',
    ])
    expect(subTrigger()).not.toBeNull()
  })

  it('el texto sale de `labels.pageSizeMenu` (UiProvider y prop)', () => {
    render(
      <UiProvider labels={{ pageSizeMenu: 'Rows per page' }}>
        <ColumnsMenu
          columns={columns}
          hidden={[]}
          onHiddenChange={() => {}}
          onReset={() => {}}
          pageSize={25}
          onPageSizeChange={() => {}}
        />
      </UiProvider>,
    )
    openMenu()
    expect(screen.getByRole('menuitem', { name: 'Rows per page' })).not.toBeNull()
  })
})

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

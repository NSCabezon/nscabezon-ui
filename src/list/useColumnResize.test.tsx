// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MIN_COLUMN_WIDTH, useColumnResize } from './useColumnResize'

// El redimensionado sale de ResponsiveList a un hook porque lo usan DOS tablas
// con markup distinto: los listados y la tabla de líneas de presupuesto (que es
// una <Table> a mano con celdas editables). Esto fija el contrato del hook —
// ancho en vivo durante el arrastre, persistencia al soltar, mínimo, y doble
// clic para volver al ancho natural— sin depender de ninguna de las dos.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

// jsdom no implementa la API de captura de puntero ni mide cajas: se stubean
// las dos piezas que el asa usa (setPointerCapture y el ancho medido del <th>).
class FakePointerEvent extends MouseEvent {
  pointerId: number
  constructor(type: string, props: MouseEventInit & { pointerId?: number } = {}) {
    super(type, { bubbles: true, cancelable: true, ...props })
    this.pointerId = props.pointerId ?? 1
  }
}

function Harness({
  widths,
  onChange,
  measuredWidth = 200,
}: {
  widths: Record<string, number>
  onChange: (next: Record<string, number>) => void
  measuredWidth?: number
}) {
  const { widthOf, resizeHandle } = useColumnResize({
    columnWidths: widths,
    onColumnWidthsChange: onChange,
  })
  const live = widthOf('name')
  return (
    <table>
      <thead>
        <tr>
          <th
            data-testid="head"
            style={{ position: 'relative', width: measuredWidth }}
            ref={(el) => {
              if (el) el.getBoundingClientRect = () => ({ width: measuredWidth }) as DOMRect
            }}
          >
            Nombre
            {resizeHandle('name')}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-testid="live">{live ?? 'sin ancho'}</td>
        </tr>
      </tbody>
    </table>
  )
}

const handle = () => container.querySelector('th > span[role="presentation"]')!
const live = () => container.querySelector('[data-testid="live"]')!.textContent

function drag(dx: number, { release = true } = {}) {
  const el = handle()
  act(() => {
    el.dispatchEvent(new FakePointerEvent('pointerdown', { button: 0, clientX: 0 }))
  })
  act(() => {
    el.dispatchEvent(new FakePointerEvent('pointermove', { clientX: dx }))
  })
  if (release) {
    act(() => {
      el.dispatchEvent(new FakePointerEvent('pointerup', { clientX: dx }))
    })
  }
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('useColumnResize', () => {
  it('arrastrar ensancha en vivo y persiste al soltar', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{}} onChange={onChange} />))

    drag(60, { release: false })
    // Durante el arrastre el ancho es local: 200 medidos + 60 de arrastre.
    expect(live()).toBe('260')
    expect(onChange).not.toHaveBeenCalled()

    act(() => {
      handle().dispatchEvent(new FakePointerEvent('pointerup', { clientX: 60 }))
    })
    expect(onChange).toHaveBeenCalledWith({ name: 260 })
  })

  it('parte del ancho GUARDADO, no del medido', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{ name: 300 }} onChange={onChange} />))
    drag(20)
    expect(onChange).toHaveBeenCalledWith({ name: 320 })
  })

  it('no baja del mínimo por mucho que se arrastre a la izquierda', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{}} onChange={onChange} />))
    drag(-1000)
    expect(onChange).toHaveBeenCalledWith({ name: MIN_COLUMN_WIDTH })
  })

  it('conserva los anchos de las demás columnas', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{ name: 100, total: 90 }} onChange={onChange} />))
    drag(10)
    expect(onChange).toHaveBeenCalledWith({ name: 110, total: 90 })
  })

  it('doble clic borra la preferencia y devuelve la columna a su ancho natural', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{ name: 300, total: 90 }} onChange={onChange} />))
    act(() => {
      handle().dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenCalledWith({ total: 90 })
  })

  it('pointercancel aborta el arrastre sin guardar nada', () => {
    const onChange = vi.fn()
    act(() => root.render(<Harness widths={{}} onChange={onChange} />))
    drag(50, { release: false })
    act(() => {
      handle().dispatchEvent(new FakePointerEvent('pointercancel', { clientX: 50 }))
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(live()).toBe('sin ancho')
  })

  // El asa se veía solo al pasarle el ratón por encima, así que había que
  // buscarla a tientas y quien no sabía que existía no la encontraba nunca. La
  // línea se pinta siempre; el hover solo la engorda.
  it('la línea del asa se ve sin pasar el ratón por encima', () => {
    act(() => root.render(<Harness widths={{}} onChange={vi.fn()} />))
    const classes = handle().className
    expect(classes).toContain('before:bg-border')
    expect(classes).not.toMatch(/(^|\s|:)opacity-0/)
  })
})

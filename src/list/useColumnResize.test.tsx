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

  // v0.9.0: con `columns` (tabla a mano o ResponsiveList) el modelo es «como
  // Excel + relleno»: arrastrar cambia SOLO esa columna.
  describe('con `columns` (como Excel + relleno)', () => {
    type Col = { key: string; width?: number; fill?: boolean; flex?: boolean; minWidth?: number }
    function ExcelHarness({
      columns,
      widths = {},
      onChange,
      measured = {},
    }: {
      columns: Col[]
      widths?: Record<string, number>
      onChange: (w: Record<string, number>) => void
      measured?: Record<string, number>
    }) {
      const { colWidth, resizeHandle, fillKey, flexKey, tableStyle } = useColumnResize({
        columnWidths: widths,
        onColumnWidthsChange: onChange,
        columns,
      })
      return (
        <table data-testid="t" style={tableStyle()}>
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} data-testid={`col-${c.key}`} style={{ width: colWidth(c.key) }} />
            ))}
          </colgroup>
          <thead>
            <tr data-fill={fillKey} data-flex={flexKey}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  data-column-width-key={c.key}
                  ref={(el) => {
                    if (el) el.getBoundingClientRect = () => ({ width: measured[c.key] ?? 0 }) as DOMRect
                  }}
                >
                  {c.key}
                  {resizeHandle(c.key)}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      )
    }
    const colW = (k: string) =>
      (container.querySelector(`[data-testid="col-${k}"]`) as HTMLElement).style.width
    const tableEl = () => container.querySelector('[data-testid="t"]') as HTMLElement
    function dragKey(i: number, dx: number, { release = true } = {}) {
      const h = container.querySelectorAll('th')[i].querySelector('span')!
      act(() => {
        h.dispatchEvent(new FakePointerEvent('pointerdown', { button: 0, clientX: 0 }))
      })
      act(() => {
        h.dispatchEvent(new FakePointerEvent('pointermove', { clientX: dx }))
      })
      if (release) {
        act(() => {
          h.dispatchEvent(new FakePointerEvent('pointerup', { clientX: dx }))
        })
      }
    }

    const cols: Col[] = [
      { key: 'client' },
      { key: 'desc', fill: true },
      { key: 'date', width: 120 },
    ]

    it('todas con ancho salvo la de relleno; la tabla: 100 % con la suma de mínimo', () => {
      act(() => root.render(<ExcelHarness columns={cols} onChange={vi.fn()} />))
      expect([colW('client'), colW('desc'), colW('date')]).toEqual(['160px', '', '120px'])
      // 160 (client, por defecto) + 160 (base del relleno) + 120.
      expect(tableEl().style.width).toBe('100%')
      expect(tableEl().style.minWidth).toBe('440px')
    })

    it('arrastrar la fecha cambia SOLO la fecha, aunque el relleno esté al mínimo', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(
          <ExcelHarness columns={cols} onChange={onChange} measured={{ client: 160, desc: 64, date: 120 }} />,
        ),
      )
      dragKey(2, 300, { release: false })
      expect([colW('client'), colW('desc'), colW('date')]).toEqual(['160px', '', '420px'])
      expect(tableEl().style.minWidth).toBe('740px')
      act(() => {
        container
          .querySelectorAll('th')[2]
          .querySelector('span')!
          .dispatchEvent(new FakePointerEvent('pointerup', { clientX: 300 }))
      })
      // Solo se guarda la arrastrada: nada de fijar otras en px.
      expect(onChange).toHaveBeenCalledWith({ date: 420 })
    })

    it('arrastrar el relleno parte de su ancho pintado y guarda su base', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={cols} onChange={onChange} measured={{ desc: 500 }} />),
      )
      dragKey(1, 40)
      expect(onChange).toHaveBeenCalledWith({ desc: 540 })
    })

    it('sin relleno: la tabla mide la suma exacta (hueco a la derecha)', () => {
      act(() =>
        root.render(
          <ExcelHarness columns={[{ key: 'a', width: 100 }, { key: 'b' }]} onChange={vi.fn()} />,
        ),
      )
      expect([colW('a'), colW('b')]).toEqual(['100px', '160px'])
      expect(tableEl().style.width).toBe('260px')
      expect(tableEl().style.minWidth).toBe('')
    })

    it('`flex` sigue funcionando como alias de `fill`', () => {
      act(() =>
        root.render(
          <ExcelHarness columns={[{ key: 'a', width: 100 }, { key: 'b', flex: true }]} onChange={vi.fn()} />,
        ),
      )
      const tr = container.querySelector('tr')!
      expect(tr.getAttribute('data-fill')).toBe('b')
      expect(tr.getAttribute('data-flex')).toBe('b')
      expect(colW('b')).toBe('')
    })

    it('`minWidth`: un ancho guardado por debajo se pinta al suelo y el arrastre no baja de él', () => {
      const onChange = vi.fn()
      const c: Col[] = [{ key: 'desc', fill: true }, { key: 'date', width: 135, minWidth: 131 }, { key: 'st', width: 200 }]
      act(() => root.render(<ExcelHarness columns={c} widths={{ date: 105 }} onChange={onChange} />))
      expect(colW('date')).toBe('131px')
      dragKey(1, -80)
      expect(onChange).toHaveBeenCalledWith({ date: 131 })
    })

    it('sin `minWidth`, el suelo es 64 y prefs viejas raras se respetan por encima', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(
          <ExcelHarness
            columns={[{ key: 'a', width: 100 }, { key: 'b', width: 100 }, { key: 'c' }]}
            widths={{ a: 10, b: 777 }}
            onChange={onChange}
          />,
        ),
      )
      expect([colW('a'), colW('b'), colW('c')]).toEqual([`${MIN_COLUMN_WIDTH}px`, '777px', '160px'])
      dragKey(0, -500)
      expect(onChange).toHaveBeenCalledWith({ a: MIN_COLUMN_WIDTH, b: 777 })
    })
  })
})

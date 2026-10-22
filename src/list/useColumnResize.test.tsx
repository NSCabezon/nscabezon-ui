// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MIN_COLUMN_WIDTH,
  RESIZE_KEY_MAX,
  RESIZE_KEY_STEP,
  RESIZE_KEY_STEP_LARGE,
  useColumnResize,
} from './useColumnResize'

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

const handle = () => container.querySelector('th > span[data-column-resize-handle=""]')!
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
      tableWidth,
      containerWidth,
    }: {
      columns: Col[]
      widths?: Record<string, number>
      onChange: (w: Record<string, number>) => void
      measured?: Record<string, number>
      /** Ancho pintado de la `<table>` (contenedor): > suma = reparto proporcional. */
      tableWidth?: number
      /** Ancho medido del contenedor (como hace `ResponsiveList`). */
      containerWidth?: number
    }) {
      const { colWidth, resizeHandle, fillKey, flexKey, tableStyle } = useColumnResize({
        columnWidths: widths,
        onColumnWidthsChange: onChange,
        columns,
        containerWidth,
      })
      return (
        <table
          data-testid="t"
          style={tableStyle()}
          ref={(el) => {
            if (el && tableWidth != null) el.getBoundingClientRect = () => ({ width: tableWidth }) as DOMRect
          }}
        >
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

    it('LIST-6: sin contenedor medido, arrastrar el relleno parte de su ancho pintado (medido)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={cols} onChange={onChange} measured={{ desc: 500 }} />),
      )
      dragKey(1, 40)
      expect(onChange).toHaveBeenCalledWith({ desc: 540 })
    })

    // Borde derecho EN PANTALLA de la columna i con reparto proporcional:
    // table-fixed al 100 % pinta cada columna a base × C / suma.
    function edgeOf(bases: number[], i: number, C: number) {
      const S = bases.reduce((a, b) => a + b, 0)
      const s = Math.max(1, C / S)
      return s * bases.slice(0, i + 1).reduce((a, b) => a + b, 0)
    }
    const abc: Col[] = [{ key: 'a', width: 100 }, { key: 'b', width: 100 }, { key: 'c', width: 200 }]

    // `/work-orders` de Gesmoto: 1026 px de columnas + Descripción (relleno,
    // base 108). A 1920 el contenedor mide 1632; a 1440, 1152.
    const wo: Col[] = [
      { key: 'number', width: 108 },
      { key: 'client', width: 216 },
      { key: 'vehicle', width: 180 },
      { key: 'description', width: 108, fill: true },
      { key: 'opened', width: 144 },
      { key: 'days', width: 144 },
      { key: 'status', width: 234 },
    ]
    const woW = () => wo.map((c) => parseFloat(colW(c.key)))
    const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    const rightOf = (xs: number[], i: number) => sumOf(xs.slice(0, i + 1))

    it('LIST-6: tope guardado a 1920: la tabla cabe a 1440 y a 1920 se ve igual', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={wo} onChange={onChange} containerWidth={1632} />))
      // Relleno libre: <col> sin ancho, se pinta a 1632 − 1026 = 606.
      expect(colW('description')).toBe('')
      dragKey(3, -40, { release: false })
      // En vivo: el borde 40 px a la izquierda de 504 + 606 = 1110.
      const during = woW()
      expect(Math.abs(rightOf(during, 3) - 1070)).toBeLessThanOrEqual(1)
      act(() => {
        container.querySelectorAll('th')[3].querySelector('span')!.dispatchEvent(
          new FakePointerEvent('pointerup', { clientX: -40 }),
        )
      })
      const saved = onChange.mock.calls.at(-1)![0] as Record<string, number>
      // Se guarda el ancho PINTADO como tope (0.9.7 guardaba 566 como ancho fijo).
      expect(saved).toEqual({ description: Math.round(during[3]) })

      // A 1920 con el tope guardado: igual que al soltar, la tabla llena justo
      // el contenedor y el sobrante va al resto en proporción.
      act(() => root.render(<ExcelHarness columns={wo} widths={saved} onChange={vi.fn()} containerWidth={1632} />))
      const at1920 = woW()
      expect(at1920[3]).toBe(saved.description)
      expect(Math.abs(rightOf(at1920, 3) - 1070)).toBeLessThanOrEqual(1)
      expect(Math.abs(sumOf(at1920) - 1632)).toBeLessThanOrEqual(0.5)
      expect(at1920[0] / at1920[1]).toBeCloseTo(108 / 216, 5)

      // A 1440 (contenedor 1152): el relleno encoge hasta lo que cabe (126) y
      // la tabla cabe sin scroll; el mínimo de la tabla es lo de serie.
      act(() => root.render(<ExcelHarness columns={wo} widths={saved} onChange={vi.fn()} containerWidth={1152} />))
      const at1440 = woW()
      expect(at1440).toEqual([108, 216, 180, 126, 144, 144, 234])
      expect(parseFloat(tableEl().style.minWidth)).toBe(1134)
      // Más estrecho aún: nunca por debajo de su base (y la tabla desborda lo
      // mismo que sin tope).
      act(() => root.render(<ExcelHarness columns={wo} widths={saved} onChange={vi.fn()} containerWidth={992} />))
      expect(parseFloat(colW('description'))).toBe(108)
    })

    it('LIST-6: arrastrar el relleno no salta: el borde sigue al ratón desde su ancho pintado', () => {
      act(() => root.render(<ExcelHarness columns={wo} onChange={vi.fn()} containerWidth={1632} />))
      for (const dx of [-4, -25, -200, 30]) {
        const h = container.querySelectorAll('th')[3].querySelector('span')!
        act(() => {
          h.dispatchEvent(new FakePointerEvent('pointerdown', { button: 0, clientX: 0 }))
        })
        act(() => {
          h.dispatchEvent(new FakePointerEvent('pointermove', { clientX: dx }))
        })
        const w = woW()
        // Hacia la izquierda, el borde va con el ratón; hacia la derecha no
        // puede pasar del ancho libre (tope = sin límite).
        const want = dx < 0 ? 1110 + dx : 1110
        expect(Math.abs(rightOf(w, 3) - want)).toBeLessThanOrEqual(1)
        expect(Math.abs(sumOf(w) - 1632)).toBeLessThanOrEqual(0.5)
        act(() => {
          h.dispatchEvent(new FakePointerEvent('pointercancel', {}))
        })
      }
    })

    it('UI-9: tras un relleno con tope, ensanchar una columna sigue al ratón hasta que el relleno cede; después 1:1 (sin hundir el relleno)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={wo} widths={{ description: 527 }} onChange={onChange} containerWidth={1632} />),
      )
      const before = woW()
      // Poco: el relleno sigue a su tope y el borde de «opened» va con el ratón.
      dragKey(4, 20, { release: false })
      expect(Math.abs(rightOf(woW(), 4) - (rightOf(before, 4) + 20))).toBeLessThanOrEqual(1)
      act(() => {
        container.querySelectorAll('th')[4].querySelector('span')!.dispatchEvent(new FakePointerEvent('pointercancel', {}))
      })
      // Mucho: el relleno cede lo justo (no se hunde a su base para alcanzar
      // al ratón) y la base de «opened» crece 1:1 desde ahí.
      dragKey(4, 60)
      const opened = (onChange.mock.calls.at(-1)![0] as Record<string, number>).opened
      expect(opened).toBeLessThan(300)
      act(() =>
        root.render(<ExcelHarness columns={wo} widths={{ description: 527, opened }} onChange={vi.fn()} containerWidth={1632} />),
      )
      expect(parseFloat(colW('description'))).toBeGreaterThan(450)
    })

    it('LIST-6: doble clic, Escape o ensancharla del todo quitan el tope (vuelve a ser relleno libre)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(
          <ExcelHarness columns={wo} widths={{ description: 500, client: 230 }} onChange={onChange} containerWidth={1632} />,
        ),
      )
      expect(colW('description')).toBe('500px')
      act(() => {
        container.querySelectorAll('th')[3].querySelector('span')!.dispatchEvent(
          new MouseEvent('dblclick', { bubbles: true }),
        )
      })
      expect(onChange).toHaveBeenLastCalledWith({ client: 230 })
      key(sep(3), 'keydown', 'Escape')
      expect(onChange).toHaveBeenLastCalledWith({ client: 230 })
      // Arrastrarla hasta su ancho libre: no se guarda un tope que no limita.
      onChange.mockClear()
      dragKey(3, 400)
      expect(onChange).toHaveBeenCalledWith({ client: 230 })
      // Y con el relleno libre, arrastrar a la derecha no guarda nada.
      act(() => root.render(<ExcelHarness columns={wo} onChange={onChange} containerWidth={1632} />))
      onChange.mockClear()
      dragKey(3, 50)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('UI-9: con reparto proporcional (escala 2) el borde sigue al ratón al arrastrar', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={abc} onChange={onChange} tableWidth={800} />))
      dragKey(1, 60, { release: false })
      // En vivo ya con la base que deja el borde en 400 + 60.
      const live = parseFloat(colW('b'))
      expect(Math.abs(edgeOf([100, live, 200], 1, 800) - 460)).toBeLessThanOrEqual(1)
      act(() => {
        container.querySelectorAll('th')[1].querySelector('span')!.dispatchEvent(
          new FakePointerEvent('pointerup', { clientX: 60 }),
        )
      })
      expect(onChange).toHaveBeenCalledWith({ b: live })
      // 0.9.7 guardaba 100 + 60: el borde se movía 60 × (800 / 460) ≈ 104… y
      // las demás encogían; aquí lo justo para 60 px.
      expect(live).toBe(171)
    })

    it('UI-9: si al ensanchar la tabla deja de caber, la escala es 1 y la base es el borde', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={abc} onChange={onChange} tableWidth={800} />))
      dragKey(1, 300)
      // Borde en 400 + 300 = 700 → base 700 − 100 (suma 900 > 800: sin reparto).
      expect(onChange).toHaveBeenCalledWith({ b: 600 })
    })

    it('UI-9: la última columna (borde pegado al contenedor) sigue su ANCHO en pantalla', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={abc} onChange={onChange} tableWidth={800} />))
      dragKey(2, -40)
      const c = (onChange.mock.calls.at(-1)![0] as Record<string, number>).c
      // Se pinta a 400 (200 × 2); 40 px menos = 360 en pantalla.
      expect(Math.abs((c * 800) / (200 + c) - 360)).toBeLessThanOrEqual(1)
      expect(c).toBe(164)
    })

    it('UI-9: ←/→ mueven el borde 16 px EN PANTALLA con escala ≠ 1', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={abc} onChange={onChange} tableWidth={800} />))
      key(sep(1), 'keydown', 'ArrowRight')
      key(sep(1), 'keydown', 'ArrowRight')
      const live = parseFloat(colW('b'))
      expect(Math.abs(edgeOf([100, live, 200], 1, 800) - (400 + 2 * RESIZE_KEY_STEP))).toBeLessThanOrEqual(1)
      key(sep(1), 'keyup', 'ArrowRight')
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ b: live })
      // Y de vuelta: dos ← lo dejan como estaba.
      act(() => root.render(<ExcelHarness columns={abc} widths={{ b: live }} onChange={onChange} tableWidth={800} />))
      key(sep(1), 'keydown', 'ArrowLeft')
      key(sep(1), 'keydown', 'ArrowLeft')
      key(sep(1), 'keyup', 'ArrowLeft')
      expect(Math.abs((onChange.mock.calls.at(-1)![0] as Record<string, number>).b - 100)).toBeLessThanOrEqual(1)
    })

    it('UI-9: con otra columna de relleno no hay reparto: 1:1', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={cols} onChange={onChange} tableWidth={1320} />),
      )
      dragKey(0, 30)
      expect(onChange).toHaveBeenCalledWith({ client: 190 })
    })

    it('sin relleno: tabla al 100 % con la suma de mínimo (v0.9.6, sin hueco)', () => {
      act(() =>
        root.render(
          <ExcelHarness columns={[{ key: 'a', width: 100 }, { key: 'b' }]} onChange={vi.fn()} />,
        ),
      )
      expect([colW('a'), colW('b')]).toEqual(['100px', '160px'])
      expect(tableEl().style.width).toBe('100%')
      expect(tableEl().style.minWidth).toBe('260px')
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

    // LIST-4 (v0.9.7): el asa se maneja con teclado.
    const sep = (i: number) => container.querySelectorAll('th')[i].querySelector('span')!
    function key(el: Element, type: 'keydown' | 'keyup', k: string, init: KeyboardEventInit = {}) {
      const ev = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, ...init })
      act(() => {
        el.dispatchEvent(ev)
      })
      return ev
    }

    it('LIST-4: el asa es un separador enfocable con nombre y valores en px', () => {
      act(() => root.render(<ExcelHarness columns={cols} widths={{ date: 130 }} onChange={vi.fn()} />))
      const h = sep(2)
      expect(h.getAttribute('role')).toBe('separator')
      expect(h.getAttribute('aria-orientation')).toBe('vertical')
      expect(h.getAttribute('tabindex')).toBe('0')
      // Sin `header`, el nombre es la clave.
      expect(h.getAttribute('aria-label')).toBe('Ajustar ancho de date')
      expect(h.getAttribute('aria-valuenow')).toBe('130')
      expect(h.getAttribute('aria-valuemin')).toBe(String(MIN_COLUMN_WIDTH))
      expect(h.getAttribute('aria-valuemax')).toBe(String(RESIZE_KEY_MAX))
      // Foco visible.
      expect(h.className).toContain('focus-visible:before:bg-ring')
      // La mitad `'start'` no es una parada de Tab ni un separador.
      act(() => root.render(<StartHarness />))
      const start = container.querySelector('[data-column-resize-handle="start"]')!
      expect(start.getAttribute('role')).toBe('presentation')
      expect(start.hasAttribute('tabindex')).toBe(false)
    })

    function StartHarness() {
      const { resizeHandle } = useColumnResize({ columnWidths: {}, columns: cols })
      return (
        <table>
          <thead>
            <tr>
              <th>{resizeHandle('client', 'start')}</th>
            </tr>
          </thead>
        </table>
      )
    }

    it('LIST-4: ←/→ cambian 16 px en vivo y se guarda UNA vez al soltar la tecla', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={cols} widths={{ x: 1 }} onChange={onChange} />))
      const h = sep(2)
      const down = key(h, 'keydown', 'ArrowRight')
      expect(down.defaultPrevented).toBe(true)
      key(h, 'keydown', 'ArrowRight')
      key(h, 'keydown', 'ArrowRight')
      // En vivo: 120 + 3 × 16, sin guardar todavía.
      expect(colW('date')).toBe(`${120 + 3 * RESIZE_KEY_STEP}px`)
      expect(sep(2).getAttribute('aria-valuenow')).toBe(String(120 + 3 * RESIZE_KEY_STEP))
      expect(onChange).not.toHaveBeenCalled()
      key(sep(2), 'keyup', 'ArrowRight')
      // Misma persistencia que el arrastre: el mapa entero con la columna nueva.
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ x: 1, date: 120 + 3 * RESIZE_KEY_STEP })
    })

    it('LIST-4: Mayús+← estrecha 64 px y nunca baja del suelo', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={cols} onChange={onChange} />))
      const h = sep(0)
      key(h, 'keydown', 'ArrowLeft', { shiftKey: true })
      expect(colW('client')).toBe(`${160 - RESIZE_KEY_STEP_LARGE}px`)
      key(sep(0), 'keydown', 'ArrowLeft', { shiftKey: true })
      expect(colW('client')).toBe(`${MIN_COLUMN_WIDTH}px`)
      key(sep(0), 'keyup', 'ArrowLeft', { shiftKey: true })
      expect(onChange).toHaveBeenCalledWith({ client: MIN_COLUMN_WIDTH })
    })

    it('LIST-4: la columna de relleno parte de su ancho pintado (como el arrastre)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={cols} onChange={onChange} measured={{ desc: 500 }} />),
      )
      key(sep(1), 'keydown', 'ArrowRight')
      key(sep(1), 'keyup', 'ArrowRight')
      expect(onChange).toHaveBeenCalledWith({ desc: 500 + RESIZE_KEY_STEP })
    })

    it('LIST-6: ← sobre el relleno a 1920 estrecha 16 px EN PANTALLA y guarda el tope', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={wo} onChange={onChange} containerWidth={1632} />))
      key(sep(3), 'keydown', 'ArrowLeft')
      expect(Math.abs(rightOf(woW(), 3) - (1110 - RESIZE_KEY_STEP))).toBeLessThanOrEqual(1)
      const live = parseFloat(colW('description'))
      key(sep(3), 'keyup', 'ArrowLeft')
      expect(onChange).toHaveBeenCalledWith({ description: Math.round(live) })
    })

    it('LIST-4: perder el foco a mitad guarda lo pendiente', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={cols} onChange={onChange} />))
      const h = sep(2) as HTMLElement
      act(() => h.focus())
      key(h, 'keydown', 'ArrowLeft')
      act(() => h.blur())
      expect(onChange).toHaveBeenCalledWith({ date: 120 - RESIZE_KEY_STEP })
    })

    it('LIST-4: Escape y Supr devuelven el ancho de serie (como el doble clic)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<ExcelHarness columns={cols} widths={{ date: 300, client: 90 }} onChange={onChange} />),
      )
      key(sep(2), 'keydown', 'Escape')
      expect(onChange).toHaveBeenLastCalledWith({ client: 90 })
      key(sep(0), 'keydown', 'Delete')
      expect(onChange).toHaveBeenLastCalledWith({ date: 300 })
      // Sin ancho guardado no escribe nada.
      onChange.mockClear()
      key(sep(1), 'keydown', 'Escape')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('LIST-4: otras teclas (Tab, Intro, Ctrl+→) no hacen nada en el asa', () => {
      const onChange = vi.fn()
      act(() => root.render(<ExcelHarness columns={cols} onChange={onChange} />))
      expect(key(sep(2), 'keydown', 'Tab').defaultPrevented).toBe(false)
      expect(key(sep(2), 'keydown', 'Enter').defaultPrevented).toBe(false)
      expect(key(sep(2), 'keydown', 'ArrowRight', { ctrlKey: true }).defaultPrevented).toBe(false)
      key(sep(2), 'keyup', 'ArrowRight')
      expect(onChange).not.toHaveBeenCalled()
      expect(colW('date')).toBe('120px')
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

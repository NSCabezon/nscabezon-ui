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

  // v0.9.9: con `columns` (tabla a mano o ResponsiveList) el modelo es
  // proporcional: agrandar una columna sube SU base y las demás encogen en
  // proporción (hasta su suelo en pantalla); el último borde controla la
  // última columna.
  describe('con `columns` (modelo proporcional)', () => {
    type Col = { key: string; width?: number; fill?: boolean; flex?: boolean; minWidth?: number; action?: boolean }
    function PropHarness({
      columns,
      widths = {},
      onChange,
      measured = {},
      tableWidth,
      containerWidth,
      legacy,
    }: {
      legacy?: boolean
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
        legacyWidths: legacy,
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
    const px = (k: string) => parseFloat(colW(k))
    const tableEl = () => container.querySelector('[data-testid="t"]') as HTMLElement
    const sep = (i: number) => container.querySelectorAll('th')[i].querySelector('span')!
    function pointer(i: number, type: string, clientX = 0) {
      act(() => {
        sep(i).dispatchEvent(new FakePointerEvent(type, { button: 0, clientX }))
      })
    }
    function dragKey(i: number, dx: number, { release = true } = {}) {
      pointer(i, 'pointerdown', 0)
      pointer(i, 'pointermove', dx)
      if (release) pointer(i, 'pointerup', dx)
    }
    function key(el: Element, type: 'keydown' | 'keyup', k: string, init: KeyboardEventInit = {}) {
      const ev = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, ...init })
      act(() => {
        el.dispatchEvent(ev)
      })
      return ev
    }
    const lastSaved = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)![0] as Record<string, number>
    const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    /** Anchos en pantalla con sitio de sobra y sin relleno: base × C / suma. */
    const spread = (bases: number[], C: number) => bases.map((b) => (b * C) / sumOf(bases))
    // Borde derecho EN PANTALLA de la columna i con reparto proporcional.
    function edgeOf(bases: number[], i: number, C: number) {
      const s = Math.max(1, C / sumOf(bases))
      return s * sumOf(bases.slice(0, i + 1))
    }

    const cols: Col[] = [
      { key: 'client' },
      { key: 'desc', fill: true },
      { key: 'date', width: 120 },
    ]
    const abc: Col[] = [{ key: 'a', width: 100 }, { key: 'b', width: 100 }, { key: 'c', width: 200 }]
    // El caso del dueño: «Acciones» al final, sin asa propia en ResponsiveList;
    // la controla el borde que comparte con la anterior.
    const acts: Col[] = [
      { key: 'name', width: 200 },
      { key: 'status', width: 120 },
      { key: 'actions', width: 100, action: true },
    ]
    // Como `/work-orders` de Gesmoto: 1082 px de columnas + Descripción
    // (relleno, base 108): mínimo de serie 1190. A 1920 el contenedor mide
    // 1632 (relleno pintado a 550).
    const wo: Col[] = [
      { key: 'number', width: 108 },
      { key: 'client', width: 216 },
      { key: 'vehicle', width: 180 },
      { key: 'description', width: 108, fill: true },
      { key: 'opened', width: 144 },
      { key: 'days', width: 144 },
      { key: 'status', width: 234 },
      { key: 'menu', width: 56, action: true },
    ]
    const woKeys = wo.map((c) => c.key)
    /** Ancho EN PANTALLA del relleno libre de `wo` a 1632: lo que dejan las demás. */
    const woFill = () => 1632 - sumOf(woKeys.filter((k) => k !== 'description').map(px))

    it('todas con ancho salvo la de relleno; la tabla: 100 % con la suma de mínimo', () => {
      act(() => root.render(<PropHarness columns={cols} onChange={vi.fn()} />))
      expect([colW('client'), colW('desc'), colW('date')]).toEqual(['160px', '', '120px'])
      // 160 (client, por defecto) + 160 (base del relleno) + 120.
      expect(tableEl().style.width).toBe('100%')
      expect(tableEl().style.minWidth).toBe('440px')
    })

    it('PROP-1: el último borde agranda la última columna y las demás encogen conservando sus proporciones', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={acts} onChange={onChange} containerWidth={840} />))
      // El asa del borde Estado|Acciones es de Acciones.
      expect(sep(1).getAttribute('aria-label')).toBe('Ajustar ancho de actions')
      expect(sep(1).getAttribute('aria-valuenow')).toBe('100')
      // Pintadas a escala 2: 400 / 240 / 200. 100 px a la izquierda: Acciones a 300.
      dragKey(1, -100, { release: false })
      const bases = [px('name'), px('status'), px('actions')]
      expect(bases.slice(0, 2)).toEqual([200, 120])
      const live = spread(bases, 840)
      expect(Math.abs(live[2] - 300)).toBeLessThanOrEqual(1)
      expect(live[0] / live[1]).toBeCloseTo(200 / 120, 5)
      pointer(1, 'pointerup', -100)
      // Solo se guarda la que se redimensiona: 300 × 320 / 540 ≈ 178.
      expect(onChange).toHaveBeenCalledWith({ actions: 178 })
      // Y hacia la derecha la estrecha, hasta su suelo (base 64).
      dragKey(1, 1000)
      expect(onChange).toHaveBeenLastCalledWith({ actions: 64 })
    })

    it('PROP-2: sin sitio, las demás encogen en proporción en pantalla y ninguna baja de su suelo', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={acts} onChange={onChange} containerWidth={420} />))
      // Justo cabe (escala 1). Acciones a 250: quedan 170 para 200 : 120 →
      // Estado se quedaría en 63.75 < 64: va al suelo y Nombre se queda el resto.
      dragKey(1, -150, { release: false })
      const live = [px('name'), px('status'), px('actions')]
      expect(Math.abs(live[2] - 250)).toBeLessThanOrEqual(0.5)
      expect(live[1]).toBe(64)
      expect(Math.abs(sumOf(live) - 420)).toBeLessThanOrEqual(0.5)
      // La tabla no crece: su mínimo es el de serie.
      expect(tableEl().style.minWidth).toBe('420px')
      pointer(1, 'pointerup', -150)
      const saved = lastSaved(onChange)
      expect(Object.keys(saved)).toEqual(['actions'])
      // Lo guardado pinta, en este contenedor, lo que se soltó.
      act(() => root.render(<PropHarness columns={acts} widths={saved} onChange={vi.fn()} containerWidth={420} />))
      expect(Math.abs(px('actions') - 250)).toBeLessThanOrEqual(0.5)
      expect(px('status')).toBe(64)
    })

    it('PROP-3: cuando todas las demás están en su suelo, la arrastrada deja de crecer', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={acts} onChange={onChange} containerWidth={420} />))
      dragKey(1, -1000, { release: false })
      expect(Math.abs(px('name') - 64)).toBeLessThanOrEqual(0.5)
      expect(px('status')).toBe(64)
      expect(Math.abs(px('actions') - 292)).toBeLessThanOrEqual(0.5)
      pointer(1, 'pointerup', -1000)
      // Se guarda la base más pequeña que da ese máximo, no una enorme.
      const { actions } = lastSaved(onChange)
      expect(actions).toBeLessThan(5000)
      act(() => root.render(<PropHarness columns={acts} widths={{ actions }} onChange={vi.fn()} containerWidth={420} />))
      expect(Math.abs(px('actions') - 292)).toBeLessThanOrEqual(0.5)
    })

    // UI-RESIZE-2 (v0.9.10): con 0.9.6-0.9.8 un ancho guardado era fijo (o
    // el tope del relleno); leído con el modelo proporcional, un `client: 566`
    // de entonces apretaba a las demás (Apertura a 100 px). Solo los anchos
    // VIEJOS (prefs sin `widthsV: 2` → `legacyWidths`) se leen con techo:
    // máx(1,5 × su serie, lo que dejan las demás a su serie en el contenedor).
    describe('UI-RESIZE-2: techo solo para anchos viejos', () => {
      const hist: Col[] = [
        { key: 'client', width: 216 },
        { key: 'opened', width: 144 },
        { key: 'status', width: 180 },
      ]
      const render = (widths: Record<string, number>, legacy: boolean, onChange = vi.fn(), containerWidth: number | undefined = 540) =>
        act(() =>
          root.render(
            <PropHarness columns={hist} widths={widths} onChange={onChange} containerWidth={containerWidth} legacy={legacy} />,
          ),
        )

      it('viejo: un ancho enorme se lee a 1,5 × su serie y no aprieta a las demás', () => {
        render({ client: 566 }, true)
        // Techo: máx(324, 540 − 324 = 216) = 324 → suma 648, escala 540/648.
        expect(Math.abs(px('client') - 270)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(px('opened') - 120)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(px('status') - 150)).toBeLessThanOrEqual(0.5)
        expect(sep(0).getAttribute('aria-valuenow')).toBe('324')
      })

      it('viejo en un contenedor ancho: el techo es el sobrante y se respeta', () => {
        render({ client: 566 }, true, vi.fn(), 1200)
        expect([px('client'), px('opened'), px('status')]).toEqual([566, 144, 180])
      })

      it('nuevo (con marca): sin techo, como 0.9.9', () => {
        render({ client: 566 }, false)
        // Suma 890 en 540: encogen todas en proporción (Apertura a 87).
        expect(Math.abs(px('client') - (566 * 540) / 890)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(px('opened') - (144 * 540) / 890)).toBeLessThanOrEqual(0.5)
      })

      it('el arrastre no tiene techo, tampoco con anchos viejos; la primera escritura guarda lo viejo limitado', () => {
        const onChange = vi.fn()
        render({ client: 566, opened: 400 }, true, onChange)
        // Estado (último borde → controla Estado) muy a la izquierda: las demás
        // a su suelo. Las viejas, leídas con techo (324 y 216).
        dragKey(1, -1000)
        const saved = lastSaved(onChange)
        expect(saved.client).toBe(324)
        expect(saved.opened).toBe(216)
        expect(saved.status).toBeGreaterThan(270)
      })

      it('nuevo: el arrastre lleva a las demás hasta su suelo y guarda la base sin techo', () => {
        const onChange = vi.fn()
        render({}, false, onChange)
        dragKey(0, 2000, { release: false })
        expect(Math.abs(px('opened') - 64)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(px('status') - 64)).toBeLessThanOrEqual(0.5)
        pointer(0, 'pointerup', 2000)
        expect(lastSaved(onChange).client).toBeGreaterThan(324)
      })

      it('el doble clic sigue borrando el guardado (y deja las demás viejas limitadas)', () => {
        const onChange = vi.fn()
        render({ client: 566, opened: 400 }, true, onChange)
        act(() => {
          sep(0).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        })
        expect(onChange).toHaveBeenLastCalledWith({ opened: 216 })
      })

      it('sin contenedor medido no hay techo (tablas a mano)', () => {
        act(() => root.render(<PropHarness columns={hist} widths={{ client: 566 }} onChange={vi.fn()} legacy />))
        expect(colW('client')).toBe('566px')
      })
    })

    it('PROP-4: con reparto proporcional (escala 2) el borde de la izquierda sigue al ratón', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={abc} onChange={onChange} tableWidth={800} />))
      // Borde de «a» en 200; 60 px a la derecha.
      dragKey(0, 60, { release: false })
      const live = px('a')
      expect(Math.abs(edgeOf([live, 100, 200], 0, 800) - 260)).toBeLessThanOrEqual(1)
      pointer(0, 'pointerup', 60)
      // Solo la arrastrada (las demás se reescalan solas): 260 × 300 / 540.
      expect(onChange).toHaveBeenCalledWith({ a: 144 })
    })

    it('PROP-5: sin contenedor medido no encoge: si al agrandar deja de caber, escala 1 (como 0.9.8)', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={abc} onChange={onChange} tableWidth={800} />))
      // Borde en 200 + 400 = 600: con suma 900 > 800 ya no hay reparto.
      dragKey(0, 400)
      expect(onChange).toHaveBeenCalledWith({ a: 600 })
    })

    it('arrastrar la fecha (asa propia de la última, tabla a mano sin contenedor) cambia SOLO la fecha', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<PropHarness columns={cols} onChange={onChange} measured={{ client: 160, desc: 64, date: 120 }} />),
      )
      dragKey(2, 300, { release: false })
      expect([colW('client'), colW('desc'), colW('date')]).toEqual(['160px', '', '420px'])
      expect(tableEl().style.minWidth).toBe('740px')
      pointer(2, 'pointerup', 300)
      expect(onChange).toHaveBeenCalledWith({ date: 420 })
    })

    it('PROP-6: con relleno libre, agrandar otra columna le quita primero su sobrante; después encogen todas', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={wo} onChange={onChange} containerWidth={1632} />))
      expect(colW('description')).toBe('')
      expect(woFill()).toBe(550)
      // Cliente (delante del relleno) +100: el borde va con el ratón y solo
      // encoge el relleno.
      dragKey(1, 100, { release: false })
      expect(px('client')).toBe(316)
      expect(woFill()).toBe(450)
      pointer(1, 'pointerup', 100)
      expect(lastSaved(onChange)).toEqual({ client: 316 })
      // Apertura (detrás del relleno) +50: crece su ancho, el relleno lo cede.
      dragKey(4, 50)
      expect(lastSaved(onChange)).toEqual({ opened: 194 })
      // Cliente +700 (más que el sobrante, 442): el relleno llega a su base y
      // a partir de ahí encogen TODAS en proporción; la tabla sigue a 1632.
      dragKey(1, 700, { release: false })
      const live = woKeys.map(px)
      expect(Math.abs(sumOf(live) - 1632)).toBeLessThanOrEqual(1)
      expect(Math.abs(live[0] + live[1] - (324 + 700))).toBeLessThanOrEqual(1)
      expect(live[0] / live[2]).toBeCloseTo(108 / 180, 5)
      pointer(1, 'pointerup', 700)
      const saved = lastSaved(onChange)
      expect(Object.keys(saved)).toEqual(['client'])
      // En una pantalla menor (contenedor 1200) eso no trae scroll: el mínimo
      // es el de serie y las columnas encogen hasta caber.
      act(() => root.render(<PropHarness columns={wo} widths={saved} onChange={vi.fn()} containerWidth={1200} />))
      expect(parseFloat(tableEl().style.minWidth)).toBe(1190)
      expect(Math.abs(sumOf(woKeys.map(px)) - 1200)).toBeLessThanOrEqual(1)
    })

    it('PROP-7: arrastrar el relleno lo hace columna normal sin saltos; con su base guardada no trae scroll en pantallas menores', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={wo} onChange={onChange} containerWidth={1632} />))
      // Su borde derecho está en 504 + 550 = 1054; 40 px a la izquierda. Ya
      // es columna normal: las demás se reescalan (en vivo, sus bases).
      dragKey(3, -40, { release: false })
      expect(Math.abs(sumOf(spread(woKeys.map(px), 1632).slice(0, 4)) - 1014)).toBeLessThanOrEqual(1)
      pointer(3, 'pointerup', -40)
      const saved = lastSaved(onChange)
      // (504 + b) × 1632 / (1082 + b) = 1014 → b ≈ 444.
      expect(saved).toEqual({ description: 444 })
      // Con ancho guardado ya no es relleno; a 1920 se ve lo que se soltó.
      act(() => root.render(<PropHarness columns={wo} widths={saved} onChange={onChange} containerWidth={1632} />))
      expect(container.querySelector('tr')!.getAttribute('data-fill')).toBeNull()
      const at1920 = spread(woKeys.map(px), 1632)
      expect(Math.abs(sumOf(at1920.slice(0, 4)) - 1014)).toBeLessThanOrEqual(1)
      // En una pantalla menor (1200): el mínimo es el de serie (1190) y las
      // columnas encogen hasta caber, sin scroll (0.9.7 daba scroll).
      act(() => root.render(<PropHarness columns={wo} widths={saved} onChange={onChange} containerWidth={1200} />))
      expect(parseFloat(tableEl().style.minWidth)).toBe(1190)
      expect(Math.abs(sumOf(woKeys.map(px)) - 1200)).toBeLessThanOrEqual(1)
      // Doble clic: vuelve a ser relleno.
      act(() => {
        sep(3).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
      })
      expect(onChange).toHaveBeenLastCalledWith({})
    })

    it('PROP-8: sin contenedor, el relleno parte de su ancho pintado medido en su <th>', () => {
      const onChange = vi.fn()
      const four: Col[] = [...cols, { key: 'st', width: 90 }]
      act(() => root.render(<PropHarness columns={four} onChange={onChange} measured={{ desc: 500 }} />))
      dragKey(1, 40)
      expect(onChange).toHaveBeenCalledWith({ desc: 540 })
    })

    it('PROP-9: ←/→ en el último borde cambian la última columna (← la agranda) y se guarda una vez', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={acts} onChange={onChange} containerWidth={840} />))
      key(sep(1), 'keydown', 'ArrowLeft')
      // 16 px más en pantalla: 216 → base 216 × 320 / 624 ≈ 111.
      expect(px('actions')).toBe(111)
      expect(sep(1).getAttribute('aria-valuenow')).toBe('111')
      expect(onChange).not.toHaveBeenCalled()
      key(sep(1), 'keyup', 'ArrowLeft')
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ actions: 111 })
      // Mayús+→ la estrecha hasta su suelo; otra más no acumula.
      act(() => root.render(<PropHarness columns={acts} widths={{ actions: 111 }} onChange={onChange} containerWidth={840} />))
      key(sep(1), 'keydown', 'ArrowRight', { shiftKey: true })
      key(sep(1), 'keydown', 'ArrowRight', { shiftKey: true })
      expect(px('actions')).toBe(64)
      key(sep(1), 'keydown', 'ArrowLeft')
      expect(px('actions')).toBeGreaterThan(64)
      key(sep(1), 'keyup', 'ArrowLeft')
      // Escape en ese borde borra el guardado de la última.
      act(() => root.render(<PropHarness columns={acts} widths={{ actions: 111, name: 150 }} onChange={onChange} containerWidth={840} />))
      key(sep(1), 'keydown', 'Escape')
      expect(onChange).toHaveBeenLastCalledWith({ name: 150 })
    })

    it('PROP-10: se guarda el mapa entero con SOLO la columna redimensionada', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={acts} widths={{ x: 1 }} onChange={onChange} containerWidth={420} />))
      dragKey(0, 30)
      const saved = lastSaved(onChange)
      expect(Object.keys(saved).sort()).toEqual(['name', 'x'])
      expect(saved.x).toBe(1)
    })

    it('sin relleno: tabla al 100 % con la suma de mínimo (v0.9.6, sin hueco)', () => {
      act(() =>
        root.render(<PropHarness columns={[{ key: 'a', width: 100 }, { key: 'b' }]} onChange={vi.fn()} />),
      )
      expect([colW('a'), colW('b')]).toEqual(['100px', '160px'])
      expect(tableEl().style.width).toBe('100%')
      expect(tableEl().style.minWidth).toBe('260px')
    })

    it('`flex` sigue funcionando como alias de `fill`', () => {
      act(() =>
        root.render(<PropHarness columns={[{ key: 'a', width: 100 }, { key: 'b', flex: true }]} onChange={vi.fn()} />),
      )
      const tr = container.querySelector('tr')!
      expect(tr.getAttribute('data-fill')).toBe('b')
      expect(tr.getAttribute('data-flex')).toBe('b')
      expect(colW('b')).toBe('')
    })

    it('`minWidth`: un ancho guardado por debajo se pinta al suelo y el arrastre no baja de él', () => {
      const onChange = vi.fn()
      const c: Col[] = [
        { key: 'desc', fill: true },
        { key: 'date', width: 135, minWidth: 131 },
        { key: 'st', width: 200 },
        { key: 'menu', width: 56 },
      ]
      act(() => root.render(<PropHarness columns={c} widths={{ date: 105 }} onChange={onChange} />))
      expect(colW('date')).toBe('131px')
      dragKey(1, -80)
      expect(onChange).toHaveBeenCalledWith({ date: 131 })
    })

    // LIST-4 (v0.9.7): el asa se maneja con teclado.
    it('LIST-4: el asa es un separador enfocable con nombre y valores en px', () => {
      act(() => root.render(<PropHarness columns={cols} widths={{ date: 130 }} onChange={vi.fn()} />))
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
      act(() => root.render(<PropHarness columns={cols} widths={{ x: 1 }} onChange={onChange} />))
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
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ x: 1, date: 120 + 3 * RESIZE_KEY_STEP })
    })

    it('LIST-4: Mayús+← estrecha 64 px y nunca baja del suelo', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={cols} onChange={onChange} />))
      key(sep(0), 'keydown', 'ArrowLeft', { shiftKey: true })
      expect(colW('client')).toBe(`${160 - RESIZE_KEY_STEP_LARGE}px`)
      key(sep(0), 'keydown', 'ArrowLeft', { shiftKey: true })
      expect(colW('client')).toBe(`${MIN_COLUMN_WIDTH}px`)
      key(sep(0), 'keyup', 'ArrowLeft', { shiftKey: true })
      expect(onChange).toHaveBeenCalledWith({ client: MIN_COLUMN_WIDTH })
    })

    it('UI-9: ←/→ mueven el borde 16 px EN PANTALLA con escala ≠ 1', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={abc} onChange={onChange} tableWidth={800} />))
      key(sep(0), 'keydown', 'ArrowRight')
      key(sep(0), 'keydown', 'ArrowRight')
      const live = px('a')
      expect(Math.abs(edgeOf([live, 100, 200], 0, 800) - (200 + 2 * RESIZE_KEY_STEP))).toBeLessThanOrEqual(1)
      key(sep(0), 'keyup', 'ArrowRight')
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ a: live })
    })

    it('LIST-4: perder el foco a mitad guarda lo pendiente', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={cols} onChange={onChange} />))
      const h = sep(2) as HTMLElement
      act(() => h.focus())
      key(h, 'keydown', 'ArrowLeft')
      act(() => h.blur())
      expect(onChange).toHaveBeenCalledWith({ date: 120 - RESIZE_KEY_STEP })
    })

    it('LIST-4: Escape y Supr devuelven el ancho de serie (como el doble clic)', () => {
      const onChange = vi.fn()
      act(() =>
        root.render(<PropHarness columns={cols} widths={{ date: 300, client: 90 }} onChange={onChange} />),
      )
      key(sep(2), 'keydown', 'Escape')
      expect(onChange).toHaveBeenLastCalledWith({ client: 90 })
      key(sep(0), 'keydown', 'Delete')
      expect(onChange).toHaveBeenLastCalledWith({ date: 300 })
      // Sin ancho guardado no escribe nada.
      onChange.mockClear()
      act(() => root.render(<PropHarness columns={cols} onChange={onChange} />))
      key(sep(1), 'keydown', 'Escape')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('LIST-4: otras teclas (Tab, Intro, Ctrl+→) no hacen nada en el asa', () => {
      const onChange = vi.fn()
      act(() => root.render(<PropHarness columns={cols} onChange={onChange} />))
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
          <PropHarness
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

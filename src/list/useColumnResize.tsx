import * as React from 'react'

import {
  MIN_COLUMN_WIDTH,
  columnFloor,
  isFillColumn,
  resolveColumnWidth,
  resolveFillColumnKey,
  tableSizing,
  type SizedColumn,
} from './columnWidth'
import { nodeText } from './nodeText'
import { useLabels, type Labels } from '../context/UiProvider'

// Reexportado aquí por compatibilidad: vivía en este módulo hasta v0.8.
export { MIN_COLUMN_WIDTH }

/** Atributo que marca cada `<th>` medible con la clave de su columna. */
export const COLUMN_WIDTH_KEY_ATTR = 'data-column-width-key'

type DragState = {
  key: string
  /** Ancho en vivo (px) de la columna arrastrada. */
  width: number
}

/**
 * Estado de anchos de una tabla con `columns`, para pintarla o para simular un
 * arrastre (v0.9.8). `bases`: base de cada columna (la de relleno: su base de
 * serie si es `free`, su tope si es `cap`). `extra`: columna fuera de
 * `columns`, delante (selección). `container`: ancho del contenedor, si se sabe.
 */
type Layout = {
  bases: number[]
  fill: number
  mode: 'none' | 'free' | 'cap'
  /** Con tope: lo mínimo a lo que encoge el relleno (min(tope, base de serie)). */
  lo: number
  extra: number
  container: number | null
}

/**
 * Anchos EN PANTALLA de cada columna (y de la extra) según el modelo:
 * - `free`: el relleno se queda el sobrante; las demás, su base.
 * - `cap` con contenedor conocido (LIST-6): el relleno ocupa como mucho su
 *   tope. Si sobra más, el resto se reparte en proporción entre las demás; si
 *   no cabe, encoge hasta lo que quepa, nunca por debajo de `lo`.
 * - `none` (y `cap` sin contenedor): table-fixed al 100 % reparte el sobrante
 *   en proporción entre todas (extra incluida).
 */
function paint(l: Layout): { widths: number[]; extra: number } {
  const C = l.container
  const others = l.bases.reduce((s, b, i) => (i === l.fill ? s : s + b), 0)
  if (l.mode === 'free') {
    const widths = l.bases.slice()
    if (C != null) widths[l.fill] = Math.max(l.bases[l.fill], C - l.extra - others)
    return { widths, extra: l.extra }
  }
  if (l.mode === 'cap' && C != null) {
    const cap = l.bases[l.fill]
    const room = C - l.extra - others
    if (room >= cap) {
      const k = others > 0 ? (C - l.extra - cap) / others : 1
      return { widths: l.bases.map((b, i) => (i === l.fill ? cap : b * k)), extra: l.extra }
    }
    const widths = l.bases.slice()
    widths[l.fill] = Math.max(l.lo, room)
    return { widths, extra: l.extra }
  }
  const sum = l.extra + l.bases.reduce((s, b) => s + b, 0)
  const k = C != null && sum > 0 ? Math.max(1, C / sum) : 1
  return { widths: l.bases.map((b) => b * k), extra: l.extra * k }
}

/** Borde derecho EN PANTALLA de la columna `i`, desde el borde izquierdo de la tabla. */
function edgeAt(p: { widths: number[]; extra: number }, i: number): number {
  let e = p.extra
  for (let j = 0; j <= i; j++) e += p.widths[j]
  return e
}

/**
 * Geometría de un arrastre o de una tecla (v0.9.8): con `columns`, `at(v)` es
 * el modelo con la columna arrastrada a `v` (su base; en la de relleno, su
 * tope) y el resto como está. Sin `columns`, `at` es `null`: 1:1.
 */
type ResizeGeo = {
  key: string
  index: number
  min: number
  max: number
  /** Valor de partida: la base; en la de relleno, su ancho PINTADO. */
  start: number
  at: ((v: number) => Layout) | null
  /** Borde derecho y ancho EN PANTALLA al empezar. */
  edge0: number
  width0: number
  /** Contenedor; si no se sabía, se aprende de la tabla en cuanto se estira. */
  container: number | null
  table: Element | null
  /**
   * Columna DETRÁS de un relleno con tope: a partir de este valor el relleno
   * ya no está a su tope y empieza a ceder sitio, así que el borde no se mueve
   * (lo que crece la columna lo pierde el relleno). Más allá, 1:1, como tras
   * un relleno libre: no se encoge el relleno de golpe para alcanzar al ratón.
   */
  breakAt?: number
}

type DragRef = {
  startX: number
  geo: ResizeGeo
  /** El puntero ya se alejó `DRAG_THRESHOLD` px: es un arrastre, no un clic. */
  moved: boolean
}

/**
 * Ancho del contenedor de la tabla, si la tabla está estirada por encima de su
 * `min-width` en línea (de `tableStyle`): entonces mide lo mismo que el
 * contenedor (`width: 100%`). Si no lo está, `null`. Para tablas a mano que no
 * pasan `containerWidth`.
 */
function stretchedWidth(table: Element | null): number | null {
  if (!(table instanceof HTMLElement)) return null
  const min = parseFloat(table.style.minWidth)
  if (!(min > 0)) return null
  const w = table.getBoundingClientRect().width
  return w > min + 0.5 ? w : null
}

/** Menor `v` en [lo, hi] con `ok(v)` (monótona); `hi` si ninguno. */
function bisect(lo: number, hi: number, ok: (v: number) => boolean): number {
  if (ok(lo)) return lo
  if (!ok(hi)) return hi
  for (let n = 0; n < 40 && hi - lo > 0.01; n++) {
    const mid = (lo + hi) / 2
    if (ok(mid)) hi = mid
    else lo = mid
  }
  return hi
}

/**
 * Valor nuevo (base o tope) para un desplazamiento `dx` (px EN PANTALLA) del
 * borde derecho (v0.9.8, LIST-6/UI-9). Con reparto proporcional mover una base
 * 1 px mueve su borde más (y reescala las demás): se busca el valor que deja
 * el borde EXACTAMENTE en `edge0 + dx` (el borde sigue al ratón). Si el borde
 * no puede ir ahí (la última columna, cuyo borde es el del contenedor, o una
 * columna tras un relleno que se queda el sobrante), se sigue su ANCHO en
 * pantalla.
 */
function baseFor(g: ResizeGeo, dx: number): number {
  const clamp = (v: number) => Math.round(Math.min(g.max, Math.max(g.min, v)))
  if (!g.at) return clamp(g.start + dx)
  const at = g.at
  const hi = Number.isFinite(g.max) ? g.max : Math.max(g.start, g.min) + Math.abs(dx) * 4 + 4000
  const measure = (v: number) => {
    const p = paint(at(v))
    return { edge: edgeAt(p, g.index), width: p.widths[g.index] }
  }
  const target = g.edge0 + dx
  if (g.breakAt != null && g.start <= g.breakAt) {
    const atBreak = measure(g.breakAt).edge
    if (target > atBreak) return clamp(g.breakAt + (target - atBreak))
  }
  const top = g.breakAt != null && g.start <= g.breakAt ? Math.min(hi, g.breakAt) : hi
  let v = bisect(g.min, top, (x) => measure(x).edge >= target)
  if (Math.abs(measure(v).edge - target) > 0.75) {
    const w = g.width0 + dx
    v = bisect(g.min, hi, (x) => measure(x).width >= w)
  }
  return clamp(v)
}

/**
 * Px que tiene que moverse el puntero desde `pointerdown` para que el asa
 * cuente como arrastre (v0.9.4). Un clic sin mover (o con temblor de 1-2 px)
 * no guarda nada: con la zona de agarre ancha de v0.9.3, un clic que apuntaba
 * a ordenar y caía en el asa guardaba el ancho estirado del relleno (dejaba de
 * rellenar) o congelaba en px una columna que no se había tocado.
 */
const DRAG_THRESHOLD = 3

/** Paso (px) de ←/→ en el asa enfocada (v0.9.7): 1 rem. */
export const RESIZE_KEY_STEP = 16
/** Paso (px) de Mayús+←/→ en el asa enfocada (v0.9.7): 4 rem. */
export const RESIZE_KEY_STEP_LARGE = 64
/**
 * Techo (px) del teclado y `aria-valuemax` del asa (v0.9.7). El ratón no tiene
 * techo; si el ancho ya lo supera, `aria-valuemax` es el propio ancho.
 */
export const RESIZE_KEY_MAX = 1600

/**
 * Columnas redimensionables con el ratón: asa en el borde derecho de cada
 * cabecera, doble clic para devolverla a su ancho natural.
 *
 * Vive aparte de `ResponsiveList` porque también lo usan tablas a mano (p. ej.
 * una tabla de líneas con celdas editables). Los anchos se persisten con
 * `useListPrefs` (`setWidths`).
 *
 * Mecánica: pointer events CON captura, así el arrastre sigue aunque el puntero
 * salga de la celda. Mientras se arrastra el ancho vive en el estado local
 * (`drag`) y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Modelo «como Excel + relleno» (v0.9.0, con `columns`):
 * - Arrastrar el borde cambia SOLO esa columna; ninguna otra se mueve ni
 *   encoge, y no hay más tope que el suelo de la propia columna
 *   (`columnFloor`: su `minWidth` o 64 px).
 * - Todas las columnas tienen ancho efectivo (`resolveColumnWidth`): guardado,
 *   `width` o `DEFAULT_COLUMN_WIDTH`. `totalWidth` es su suma.
 * - La de relleno (`fill: true`, alias `flex`) tiene un ancho BASE como las
 *   demás (cuenta en la suma) y se estira encima si sobra sitio: su `<col>`
 *   va sin ancho (`colWidth` → `undefined`) y la tabla lleva `tableStyle`
 *   (`tableSizing`). Sin relleno, la tabla sigue al 100 % y table-fixed
 *   reparte el sobrante en proporción entre todas.
 * - Relleno con TOPE (v0.9.8, LIST-6; dueño 22/10/2026): al arrastrar la de
 *   relleno, el borde sigue al ratón desde su ancho PINTADO (sin saltos) y al
 *   soltar ese ancho pintado se guarda como su tope: «como mucho X». Con el
 *   ancho del contenedor (`containerWidth`), en una pantalla mayor se ve a X y
 *   el sobrante va al resto en proporción; en una menor encoge hasta lo que
 *   quepa (nunca por debajo de su base ni de su suelo) y sin scroll si lo de
 *   serie cabía. Antes ese ancho pintado (base + el sobrante de ESA pantalla)
 *   era un ancho fijo, y como los anchos viajan entre dispositivos, a 1440 la
 *   tabla de `/work-orders` medía 1592 px en 1152. Doble clic, Escape o Supr
 *   quitan el tope (relleno libre); ensancharla hasta que el tope no limite
 *   nada, también.
 * - El borde sigue al ratón también con reparto proporcional (v0.9.8, UI-9):
 *   el delta en pantalla se convierte a base resolviendo el modelo (la base
 *   de una columna escalada cambia `dx × suma / C`, y las demás se reescalan).
 * Sin `columns` (tablas a mano antiguas): cambia la arrastrada, partiendo del
 * ancho guardado o, si no hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 *
 * Teclado (v0.9.7, LIST-4): el asa `'end'` es un `role="separator"` enfocable
 * (`aria-orientation="vertical"`, `aria-label` = `labels.columnResize(columna)`,
 * `aria-valuenow/min/max` en px). ←/→ cambian 16 px (1 rem), Mayús+←/→ 64 px;
 * se ve en vivo y se guarda al soltar la tecla (o al perder el foco), por el
 * mismo `onColumnWidthsChange` que el arrastre y con el mismo suelo. Escape,
 * Supr o Retroceso borran el ancho guardado, como el doble clic. La mitad
 * `'start'` no es enfocable (sería la misma columna dos veces en el Tab).
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns,
  containerWidth,
  leadingWidth = 0,
  labels: labelsProp,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /** Columnas VISIBLES, en orden: activa el modelo «como Excel + relleno». */
  columns?: SizedColumn[]
  /**
   * Ancho (px) del contenedor de la `<table>` (v0.9.8, LIST-6). Con él, el
   * tope de la columna de relleno se aplica (encoge hasta lo que quepa y el
   * sobrante va al resto). Sin él (o 0, como en jsdom), el tope se pinta como
   * un ancho fijo (lo de 0.9.6). `ResponsiveList` lo mide con un ResizeObserver.
   */
  containerWidth?: number
  /** Px de columnas fuera de `columns`, DELANTE (p. ej. la de selección). */
  leadingWidth?: number
  /** Textos propios (`columnResize`); ganan al `UiProvider`. */
  labels?: Partial<Labels>
}) {
  const labels = useLabels(labelsProp)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragRef | null>(null)
  // Teclado (v0.9.7): ancho en curso de ←/→ sobre el asa enfocada. Vive en
  // `drag` (en vivo) y se guarda al soltar la tecla o al perder el foco: una
  // tecla mantenida son decenas de `keydown` y una sola escritura. Desde
  // v0.9.8 guarda también la geometría de partida y el delta EN PANTALLA.
  const keyRef = React.useRef<{ geo: ResizeGeo; dx: number; width: number } | null>(null)

  const colOf = (key: string) => columns?.find((c) => c.key === key)
  const container = containerWidth && containerWidth > 0 ? containerWidth : null

  // Columna de relleno: la primera `fill`. Sin ancho guardado es relleno
  // LIBRE (se queda el sobrante). Con ancho guardado, o mientras se arrastra,
  // ese ancho es su TOPE (v0.9.8, LIST-6): ocupa como mucho eso.
  const fillIndex = columns ? columns.findIndex(isFillColumn) : -1
  const fillCol = fillIndex >= 0 ? columns![fillIndex] : undefined
  const restingFillKey = columns ? resolveFillColumnKey(columns, columnWidths) : undefined
  const fillKey = drag?.key === restingFillKey ? undefined : restingFillKey
  const fillMode: Layout['mode'] = !fillCol ? 'none' : fillKey ? 'free' : 'cap'

  /** Ancho efectivo sin arrastre (con `columns`): guardado/`width`/defecto, con suelo. */
  function baseWidth(key: string): number | undefined {
    const col = colOf(key)
    return col ? resolveColumnWidth(col, columnWidths?.[key]) : columnWidths?.[key]
  }

  /** Ancho vigente de una columna: el del arrastre en curso, o el guardado. */
  function widthOf(key: string): number | undefined {
    return drag?.key === key ? drag.width : columnWidths?.[key]
  }

  /**
   * Ancho de la columna en el modelo: el del arrastre en curso o el efectivo.
   * En la de relleno libre es su BASE; con tope, el tope.
   */
  function liveWidth(key: string): number | undefined {
    return drag?.key === key ? drag.width : baseWidth(key)
  }

  /** Modelo actual (o con la columna `key` a `v`, para simular un arrastre). */
  function layoutWith(key?: string, v?: number, at: number | null = container, extra = leadingWidth): Layout {
    const cols = columns ?? []
    const bases = cols.map((c) => (c.key === key ? v! : (liveWidth(c.key) ?? 0)))
    const dragsFill = key != null && key === fillCol?.key
    const mode: Layout['mode'] = dragsFill ? 'cap' : fillMode
    const fillDefault = fillCol ? resolveColumnWidth(fillCol, undefined) : 0
    return {
      bases,
      fill: fillIndex,
      mode,
      lo: mode === 'cap' ? Math.min(bases[fillIndex], fillDefault) : 0,
      extra,
      container: at,
    }
  }

  // Con tope y contenedor conocido, cada `<col>` lleva su ancho EN PANTALLA
  // (calculado aquí): table-fixed no sabe poner un máximo a una columna.
  const painted = columns && fillMode === 'cap' && container != null ? paint(layoutWith()) : null

  /**
   * Ancho para el `<col>`: el vivo de cada columna; la de relleno libre,
   * ninguno (`undefined`): table-fixed le da todo el sobrante. Con tope y
   * contenedor, el ancho en pantalla de cada columna.
   */
  function colWidth(key: string): number | undefined {
    if (key === fillKey) return undefined
    if (painted) {
      const i = columns!.findIndex((c) => c.key === key)
      if (i >= 0) return painted.widths[i]
    }
    return liveWidth(key)
  }

  /**
   * Suma de los anchos de `columns`: el mínimo de la tabla. La de relleno
   * libre cuenta con su base; con tope, con lo mínimo a lo que encoge.
   */
  const totalWidth = columns
    ? columns.reduce((sum, c, i) => {
        const w = liveWidth(c.key) ?? 0
        if (i === fillIndex && fillMode === 'cap' && container != null) {
          return sum + Math.min(w, resolveColumnWidth(c, undefined))
        }
        return sum + w
      }, 0)
    : undefined

  /** Estilo de la `<table>` para `extra` px fuera de `columns` (p. ej. una columna de selección). */
  function tableStyle(extra = leadingWidth): React.CSSProperties | undefined {
    return totalWidth == null ? undefined : tableSizing(totalWidth + extra, !!fillKey)
  }

  /**
   * `<th>` de `columnKey` (para medir su ancho pintado): la marcada con
   * `COLUMN_WIDTH_KEY_ATTR` en la misma fila; si la tabla no la marca, la que
   * contiene el asa (`'end'`) o la anterior a ella (`'start'`).
   */
  function headOf(handle: Element, columnKey: string, edge: 'end' | 'start'): Element | null {
    const own = handle.parentElement
    const row = handle.closest('tr')
    if (row) {
      for (const el of Array.from(row.querySelectorAll(`[${COLUMN_WIDTH_KEY_ATTR}]`))) {
        if (el.getAttribute(COLUMN_WIDTH_KEY_ATTR) === columnKey) return el
      }
    }
    return edge === 'start' ? (own?.previousElementSibling ?? null) : own
  }

  /**
   * Geometría de partida de un arrastre o de una tecla sobre `columnKey`
   * (v0.9.8). Las columnas normales parten de su base; la de relleno, de su
   * ancho PINTADO (sin saltos), que al soltar queda como su tope (LIST-6). El
   * delta en pantalla se pasa a base/tope con el modelo (`baseFor`): el borde
   * sigue al ratón también con el sobrante repartido (UI-9).
   *
   * Sin `columns` (tablas a mano antiguas): ancho guardado o medido, 1:1.
   */
  function geometryOf(columnKey: string, handle: Element, edge: 'end' | 'start', max: number): ResizeGeo {
    const table = handle.closest('table')
    const min = floorOf(columnKey)
    const index = columns ? columns.findIndex((c) => c.key === columnKey) : -1
    const measured = () => headOf(handle, columnKey, edge)?.getBoundingClientRect().width || 0
    if (!columns || index < 0) {
      const start = columnWidths?.[columnKey] ?? measured()
      return { key: columnKey, index, min, max: Math.max(max, start), start, at: null, edge0: 0, width0: start, container: null, table }
    }
    // Columna extra (selección): la que diga el consumidor o, en tablas a
    // mano, la diferencia entre el `min-width` pintado y la suma de `columns`.
    const minW = table instanceof HTMLElement ? parseFloat(table.style.minWidth) : NaN
    const extra =
      leadingWidth || (minW > 0 && totalWidth != null ? Math.max(0, minW - totalWidth) : 0)
    const C = container ?? stretchedWidth(table)
    const isFill = columnKey === fillCol?.key
    let start = baseWidth(columnKey)!
    if (isFill) {
      // Ancho pintado del relleno: el del modelo si se sabe el contenedor; si
      // no, el medido del `<th>`.
      start =
        C != null
          ? paint(layoutWith(undefined, undefined, C, extra)).widths[index]
          : measured() || start
    }
    const geo: ResizeGeo = {
      key: columnKey,
      index,
      min,
      max: Math.max(max, start),
      start,
      at: (v) => layoutWith(columnKey, v, geo.container, extra),
      edge0: 0,
      width0: start,
      container: C,
      table,
    }
    const p = paint(geo.at!(start))
    geo.edge0 = edgeAt(p, index)
    geo.width0 = p.widths[index]
    if (fillMode === 'cap' && !isFill && index > fillIndex && C != null) {
      const l = geo.at!(start)
      const othersButThis = l.bases.reduce((s, b, i) => (i === fillIndex || i === index ? s : s + b), 0)
      geo.breakAt = C - extra - l.bases[fillIndex] - othersButThis
    }
    return geo
  }

  /** Aprende el ancho del contenedor (tablas a mano) en cuanto la tabla se pinta estirada. */
  function learn(g: ResizeGeo) {
    if (g.at && g.container == null) g.container = stretchedWidth(g.table)
  }

  function floorOf(columnKey: string): number {
    const col = colOf(columnKey)
    return col ? columnFloor(col) : MIN_COLUMN_WIDTH
  }

  /** Guarda `px` para `key` (si cambia), igual que al soltar un arrastre. */
  function commit(key: string, px: number) {
    if (columnWidths?.[key] === px) return
    onColumnWidthsChange?.({ ...columnWidths, [key]: px })
  }

  /** Borra el ancho guardado de `key`: vuelve a su ancho de serie (doble clic, Escape/Supr). */
  function restore(key: string) {
    const next = { ...columnWidths }
    delete next[key]
    onColumnWidthsChange?.(next)
  }

  /**
   * Fin de un arrastre o de una tecla con valor `v`. En la de relleno, si el
   * tope no limita nada en esta pantalla (se ve tan ancha como la libre), no
   * se guarda tope: vuelve a ser relleno libre (LIST-6). Así, ensancharla del
   * todo es lo mismo que el doble clic.
   */
  function finish(g: ResizeGeo, v: number) {
    if (g.at && g.key === fillCol?.key && g.container != null) {
      const free = paint({ ...g.at(v), mode: 'free', bases: g.at(v).bases.map((b, i) => (i === g.index ? resolveColumnWidth(fillCol, undefined) : b)) })
      const capped = paint(g.at(v))
      if (capped.widths[g.index] >= free.widths[g.index] - 0.5) {
        if (columnWidths?.[g.key] != null) restore(g.key)
        return
      }
    }
    commit(g.key, v)
  }

  /** Guarda el ancho de teclado pendiente, si lo hay. */
  function flushKey() {
    const k = keyRef.current
    if (!k) return
    keyRef.current = null
    setDrag(null)
    if (k.dx !== 0) finish(k.geo, k.width)
  }

  function nameOf(columnKey: string, name?: string): string {
    return name ?? (nodeText(colOf(columnKey)?.header as React.ReactNode) || columnKey)
  }

  /**
   * Asa de redimensión. Va dentro de un `<th>` con `relative` (la propia asa es
   * `absolute`). Quien pinta la tabla decide en qué columnas ponerla.
   *
   * La línea se ve SIEMPRE (no solo al pasar por encima): un asa invisible hay
   * que buscarla a tientas con el ratón, y quien no sepa que existe no la
   * encuentra nunca. La zona de agarre sigue siendo más ancha que la línea.
   *
   * Devuelve JSX, NO un componente: un componente declarado aquí cambiaría de
   * identidad en cada render del hook, así que React desmontaría el asa en
   * cuanto el arrastre actualiza el ancho — y con ella, la captura del puntero.
   *
   * `edge` (v0.9.3): `'end'` (por defecto) es el asa de siempre, en el borde
   * derecho de la propia `<th>` de `columnKey`. `'start'` es la otra mitad de
   * la zona de agarre: va en el borde IZQUIERDO de la `<th>` SIGUIENTE y
   * redimensiona `columnKey` (la anterior). Hace falta porque la `<th>` lleva
   * `overflow-hidden` (no se puede sacar el asa por fuera) y, desde que las
   * cabeceras se arrastran para reordenar (v0.9.0), fallar el asa por 1 px a la
   * derecha de la línea agarraba la cabecera vecina y la MOVÍA. Con las dos
   * mitades la zona queda centrada en la línea, como en Excel. Sin línea
   * propia (la pinta el asa `'end'`), solo se resalta al pasar por encima.
   *
   * `name` (v0.9.7): nombre de la columna para el `aria-label` del asa. Por
   * defecto, el texto de su `header` en `columns` o, si no, su clave.
   */
  function resizeHandle(columnKey: string, edge: 'end' | 'start' = 'end', name?: string) {
    // Solo el asa `'end'` es enfocable: la `'start'` es la misma columna (otra
    // mitad de la zona de agarre) y sería una parada de Tab repetida.
    const focusable = edge === 'end'
    const now = focusable ? liveWidth(columnKey) : undefined
    const a11y: React.HTMLAttributes<HTMLSpanElement> = focusable
      ? {
          role: 'separator',
          tabIndex: 0,
          'aria-orientation': 'vertical',
          'aria-label': labels.columnResize(nameOf(columnKey, name)),
          'aria-valuenow': now,
          'aria-valuemin': floorOf(columnKey),
          'aria-valuemax': Math.max(RESIZE_KEY_MAX, now ?? 0),
        }
      : { role: 'presentation' }
    return (
      <span
        {...a11y}
        // Gancho para `ResponsiveList`: arrastrar desde el asa redimensiona,
        // nunca reordena la columna.
        data-column-resize-handle={edge === 'start' ? 'start' : ''}
        className={
          edge === 'start'
            ? "absolute inset-y-0 left-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:content-[''] hover:before:bg-muted-foreground"
            : // Foco visible (v0.9.7): la zona se tiñe y la línea pasa a ser
              // de 2 px a toda altura con el color del anillo de foco.
              "absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none outline-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground focus-visible:bg-ring/30 focus-visible:before:inset-y-0 focus-visible:before:w-0.5 focus-visible:before:bg-ring"
        }
        onKeyDown={
          focusable
            ? (e) => {
                // Teclado (v0.9.7): ←/→ 16 px (1 rem), Mayús+←/→ 64 px;
                // Escape/Supr/Retroceso vuelven al ancho de serie (como el
                // doble clic). Nada sube: ni ordena la cabecera ni la mueve.
                if (e.altKey || e.ctrlKey || e.metaKey) return
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  e.stopPropagation()
                  // Los pasos son px EN PANTALLA (v0.9.8, UI-9): con reparto
                  // proporcional el borde se mueve 16 px, no 16 × escala.
                  const step = e.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP
                  const cur =
                    keyRef.current?.geo.key === columnKey
                      ? keyRef.current
                      : {
                          geo: geometryOf(columnKey, e.currentTarget, edge, RESIZE_KEY_MAX),
                          dx: 0,
                          width: baseWidth(columnKey) ?? 0,
                        }
                  learn(cur.geo)
                  const dx = cur.dx + (e.key === 'ArrowRight' ? step : -step)
                  const width = baseFor(cur.geo, dx)
                  // En el suelo o el techo el delta no se acumula: la tecla
                  // contraria responde a la primera.
                  keyRef.current = width === cur.width ? cur : { geo: cur.geo, dx, width }
                  setDrag({ key: columnKey, width })
                  return
                }
                if (e.key === 'Escape' || e.key === 'Delete' || e.key === 'Backspace') {
                  e.preventDefault()
                  e.stopPropagation()
                  keyRef.current = null
                  setDrag(null)
                  if (columnWidths?.[columnKey] != null) restore(columnKey)
                }
              }
            : undefined
        }
        onKeyUp={
          focusable
            ? (e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.stopPropagation()
                flushKey()
              }
            : undefined
        }
        onBlur={focusable ? flushKey : undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const d: DragRef = {
            startX: e.clientX,
            // El ratón no tiene techo.
            geo: geometryOf(columnKey, e.currentTarget, edge, Infinity),
            moved: false,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = d
          // Sin `setDrag` todavía: hasta que el puntero se mueva es un clic y
          // nada cambia (ni el relleno deja de rellenar).
          e.preventDefault()
        }}
        onPointerMove={(e) => {
          const d = dragRef.current
          if (!d) return
          if (!d.moved && Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return
          d.moved = true
          learn(d.geo)
          setDrag({ key: d.geo.key, width: baseFor(d.geo, e.clientX - d.startX) })
        }}
        onPointerUp={(e) => {
          const d = dragRef.current
          if (!d) return
          dragRef.current = null
          setDrag(null)
          // Clic sin arrastre (v0.9.4): no se guarda nada. Doble clic sigue
          // llegando a `onDoubleClick` (dos clics sin mover).
          const moved = d.moved || Math.abs(e.clientX - d.startX) >= DRAG_THRESHOLD
          if (!moved) return
          learn(d.geo)
          finish(d.geo, baseFor(d.geo, e.clientX - d.startX))
        }}
        onPointerCancel={() => {
          dragRef.current = null
          setDrag(null)
        }}
        // Doble clic en el asa: la columna vuelve a su ancho natural (se borra
        // la preferencia, no se guarda un ancho "por defecto").
        onDoubleClick={() => restore(columnKey)}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return {
    widthOf,
    colWidth,
    fillKey,
    /** @deprecated v0.9.0: usa `fillKey`. */
    flexKey: fillKey,
    totalWidth,
    tableStyle,
    resizeHandle,
  }
}

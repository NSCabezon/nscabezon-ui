import * as React from 'react'

import {
  MIN_COLUMN_WIDTH,
  columnFloor,
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
  /** Columna que se redimensiona (la que controla el asa). */
  key: string
  /** Base en vivo (px) de esa columna. */
  width: number
}

/**
 * Estado de anchos de una tabla con `columns`, para pintarla o para simular un
 * arrastre (v0.9.9). `bases`: base de cada columna. `fill`: índice del relleno
 * LIBRE (sin ancho guardado) o -1. `extra`: columna fuera de `columns`,
 * delante (selección). `container`: ancho del contenedor, si se sabe.
 * `minTotal`: lo mínimo que suman las columnas en pantalla (ver `minColumns`).
 */
type Layout = {
  bases: number[]
  floors: number[]
  fill: number
  extra: number
  container: number | null
  minTotal: number
  /**
   * Las columnas pueden encoger por debajo de su base (hace falta conocer el
   * contenedor para pintar sus anchos). Sin él, si no caben, scroll.
   */
  canShrink: boolean
}

/**
 * Lo mínimo que suman las columnas en pantalla (v0.9.9): la suma de bases o la
 * de serie, la menor, y nunca menos que la de los suelos. Por debajo, scroll.
 * Así, agrandar columnas nunca adelanta el scroll en ninguna pantalla: como
 * mucho empieza donde empezaba con los anchos de serie (LIST-6: los anchos
 * guardados viajan entre dispositivos).
 */
function minColumns(bases: number[], defaults: number[], floors: number[]): number {
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
  return Math.max(sum(floors), Math.min(sum(bases), sum(defaults)))
}

/**
 * Anchos EN PANTALLA de cada columna (y de la extra) según el modelo
 * proporcional (v0.9.9):
 * - Contenedor desconocido: cada una a su base (table-fixed decide).
 * - Cabe (`C ≥ suma + extra`): con relleno libre, las demás a su base y el
 *   relleno se queda el sobrante; sin él, table-fixed al 100 % reparte el
 *   sobrante en proporción entre todas (extra incluida).
 * - No cabe: las columnas encogen en proporción hasta llenar
 *   `máx(C, extra + minTotal)`, cada una como mucho hasta su suelo; las que
 *   llegan a él se quedan ahí y el resto sigue encogiendo en proporción. La
 *   extra no encoge. `scaled` indica que hay que pintar estos anchos en los
 *   `<col>` (table-fixed no sabe encoger columnas).
 */
function paint(l: Layout): { widths: number[]; extra: number; scaled: boolean } {
  const C = l.container
  const S = l.bases.reduce((s, b) => s + b, 0)
  if (C == null) return { widths: l.bases.slice(), extra: l.extra, scaled: false }
  if (C >= S + l.extra) {
    if (l.fill >= 0) {
      const widths = l.bases.slice()
      widths[l.fill] += C - l.extra - S
      return { widths, extra: l.extra, scaled: false }
    }
    const k = S + l.extra > 0 ? C / (S + l.extra) : 1
    return { widths: l.bases.map((b) => b * k), extra: l.extra * k, scaled: false }
  }
  const avail = Math.max(C, l.extra + l.minTotal) - l.extra
  if (!l.canShrink || avail >= S) return { widths: l.bases.slice(), extra: l.extra, scaled: false }
  // Reparto con suelos: las que en proporción quedarían bajo su suelo se
  // quedan en él y el resto se reparte lo que queda, en proporción.
  const floored = l.bases.map(() => false)
  let r = 0
  for (let n = 0; n <= l.bases.length; n++) {
    let fixed = 0
    let free = 0
    l.bases.forEach((b, i) => {
      if (floored[i]) fixed += l.floors[i]
      else free += b
    })
    r = free > 0 ? Math.max(0, avail - fixed) / free : 0
    let changed = false
    l.bases.forEach((b, i) => {
      if (!floored[i] && b * r < l.floors[i]) {
        floored[i] = true
        changed = true
      }
    })
    if (!changed) break
  }
  return {
    widths: l.bases.map((b, i) => (floored[i] ? l.floors[i] : b * r)),
    extra: l.extra,
    scaled: true,
  }
}

/** Borde derecho EN PANTALLA de la columna `i`, desde el borde izquierdo de la tabla. */
function edgeAt(p: { widths: number[]; extra: number }, i: number): number {
  let e = p.extra
  for (let j = 0; j <= i; j++) e += p.widths[j]
  return e
}

/**
 * Geometría de un arrastre o de una tecla (v0.9.9): con `columns`, `at(v)` es
 * el modelo con la columna controlada a base `v` y el resto como está. Sin
 * `columns`, `at` es `null`: 1:1.
 */
type ResizeGeo = {
  /** Columna que controla el asa. */
  key: string
  index: number
  min: number
  max: number
  /** Base de partida (en el relleno libre, su ancho PINTADO). */
  start: number
  at: ((v: number) => Layout) | null
  /**
   * Qué sigue al ratón: el borde derecho de la columna (`edge`), su ancho
   * (`width`), o su ancho al revés (`width-rev`: el último borde controla la
   * última columna, que crece hacia la izquierda).
   */
  follow: 'edge' | 'width' | 'width-rev'
  /** Borde derecho o ancho EN PANTALLA al empezar, según `follow`. */
  ref0: number
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
  for (let n = 0; n < 60 && hi - lo > 0.01; n++) {
    const mid = (lo + hi) / 2
    if (ok(mid)) hi = mid
    else lo = mid
  }
  return hi
}

/**
 * Base nueva para un desplazamiento `dx` (px EN PANTALLA) del puntero
 * (v0.9.9). Con el reparto proporcional mover una base reescala las demás: se
 * busca, con el mismo modelo con el que se pinta, la base que deja el borde
 * (o el ancho) EXACTAMENTE donde está el ratón. Lo pintado crece con la base
 * (monótono), así que basta una bisección. Si el ratón va más allá de lo que
 * se puede (todas las demás en su suelo), se queda en la base más pequeña que
 * da ese máximo: no se guardan bases enormes que no se ven.
 */
function baseFor(g: ResizeGeo, dx: number): number {
  const clamp = (v: number) => Math.round(Math.min(g.max, Math.max(g.min, v)))
  if (!g.at) return clamp(g.start + dx)
  const at = g.at
  const measure = (v: number) => {
    const p = paint(at(v))
    return g.follow === 'edge' ? edgeAt(p, g.index) : p.widths[g.index]
  }
  const target = g.ref0 + (g.follow === 'width-rev' ? -dx : dx)
  const hi = Number.isFinite(g.max) ? g.max : Math.max(1e6, g.start * 4)
  const top = measure(hi)
  const want = Math.min(target, top - 0.25)
  return clamp(bisect(g.min, hi, (x) => measure(x) >= want))
}

/**
 * Desplazamiento (px EN PANTALLA) que corresponde a la base `v`: lo que se
 * movió de verdad el borde (o el ancho). El teclado acumula esto y no las
 * teclas pulsadas, así en el suelo o en el techo la tecla contraria responde
 * a la primera.
 */
function screenDelta(g: ResizeGeo, v: number): number {
  if (!g.at) return v - g.start
  const p = paint(g.at(v))
  const m = g.follow === 'edge' ? edgeAt(p, g.index) : p.widths[g.index]
  return g.follow === 'width-rev' ? g.ref0 - m : m - g.ref0
}

/**
 * Px que tiene que moverse el puntero desde `pointerdown` para que el asa
 * cuente como arrastre (v0.9.4). Un clic sin mover (o con temblor de 1-2 px)
 * no guarda nada: con la zona de agarre ancha de v0.9.3, un clic que apuntaba
 * a ordenar y caía en el asa guardaba el ancho estirado del relleno (dejaba de
 * rellenar) o congelaba en px una columna que no se había tocado.
 */
const DRAG_THRESHOLD = 3

/**
 * Techo de un ancho guardado ANTES de 0.9.9 (sin marca `widthsV: 2`), en
 * múltiplos de su ancho de serie (v0.9.10, UI-RESIZE-2). Ver
 * `useColumnResize` («Anchos viejos»).
 */
export const STORED_WIDTH_MAX_FACTOR = 1.5

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
 * Columnas redimensionables con el ratón y el teclado: asa en los bordes entre
 * cabeceras, doble clic para devolver la columna a su ancho de serie.
 *
 * Vive aparte de `ResponsiveList` porque también lo usan tablas a mano (p. ej.
 * una tabla de líneas con celdas editables). Los anchos se persisten con
 * `useListPrefs` (`setWidths`).
 *
 * Mecánica: pointer events CON captura, así el arrastre sigue aunque el puntero
 * salga de la celda. Mientras se arrastra el ancho vive en el estado local
 * (`drag`) y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Modelo proporcional (v0.9.9, dueño 24/10/2026; con `columns`):
 * - La tabla mide SIEMPRE el 100 % del contenedor. Cada columna tiene una
 *   base (`resolveColumnWidth`: guardada, `width` o `DEFAULT_COLUMN_WIDTH`,
 *   nunca por debajo de su suelo `columnFloor`). Si sobra sitio, table-fixed
 *   lo reparte en proporción a las bases; si falta, las columnas encogen en
 *   proporción hasta su suelo EN PANTALLA (las que llegan se quedan en él y el
 *   resto sigue encogiendo), con los anchos calculados aquí en cada `<col>`.
 *   El scroll lateral solo aparece por debajo de `minColumns`: la suma de
 *   bases o la de serie, la menor (nunca menos que los suelos). Así agrandar
 *   columnas nunca trae scroll, en esta pantalla ni en otra menor (LIST-6).
 * - Agrandar una columna = subir SU base: las demás encogen en proporción
 *   (conservan sus proporciones entre sí) y ninguna baja de su suelo en
 *   pantalla; cuando todas las demás están en su suelo, la arrastrada ya no
 *   crece más. Estrecharla para en su propio suelo. Se guarda SOLO la base de
 *   la arrastrada (las demás siguen su `width` de serie, que en Gesmoto va en
 *   rem y escala con la fuente), calculada para que en ESTE contenedor se vea
 *   exactamente lo que se soltó.
 * - Qué columna controla cada asa: la de la IZQUIERDA del borde, salvo el
 *   último borde (entre la penúltima y la última), que controla la ÚLTIMA:
 *   arrastrarlo a la izquierda agranda la última (p. ej. «Acciones»), a la
 *   derecha la estrecha. `resizeHandle(penúltima)` y
 *   `resizeHandle(penúltima, 'start')` hacen eso solos.
 * - El ratón manda: se resuelve, con el mismo modelo con el que se pinta, la
 *   base que deja el borde derecho de la columna exactamente bajo el puntero
 *   (en el último borde, el ancho de la última). Tras un relleno libre el
 *   borde derecho no se mueve (el relleno absorbe), así que ahí se sigue el
 *   ancho de la columna.
 * - Relleno (`fill: true`, alias `flex`; la primera marcada): sin ancho
 *   guardado se queda el sobrante (su `<col>` sin ancho). Agrandar otra
 *   columna le quita primero ese sobrante (las demás no se mueven) y, cuando
 *   ya está a su base, encogen todas en proporción. Arrastrar el propio
 *   relleno lo convierte en columna normal: parte de su ancho PINTADO (sin
 *   saltos) y al soltar se guarda su base; con ancho guardado deja de ser
 *   relleno (`resolveFillColumnKey`, v0.9.6). Doble clic, Escape o Supr lo
 *   vuelven a hacer relleno. El ancho guardado de un relleno (también el de
 *   0.9.6-0.9.8, p. ej. 566 a 1920) ya no trae scroll en pantallas menores:
 *   lo impide `minColumns`.
 * - Anchos viejos (v0.9.10, UI-RESIZE-2; `legacyWidths`, con contenedor
 *   medido): hasta la 0.9.8 un ancho guardado era un ancho fijo (con scroll si
 *   no cabía) o, en el relleno, un tope; con el reparto proporcional un
 *   `client: 566` de entonces apretaba a las demás (Apertura a 100 px). Si
 *   los anchos vienen de antes de la marca (`widthsV: 2`, ver
 *   `hasLegacyWidths`), cada ancho guardado se lee como mucho a `capOf`: lo
 *   mayor entre 1,5 × su ancho de serie (`STORED_WIDTH_MAX_FACTOR`) y lo que
 *   le dejan las demás a su ancho de serie dentro del contenedor. La primera
 *   escritura (arrastre, teclado, doble clic) guarda ya los anchos LIMITADOS
 *   (los que se ven) y `useListPrefs.setWidths` les pone la marca: desde ahí
 *   no hay techo. El arrastre y el teclado no tienen techo nunca (el modelo
 *   de 0.9.9: las demás encogen hasta su suelo).
 * Sin `columns` (tablas a mano antiguas, p. ej. las líneas de presupuesto de
 * Gesmoto): cambia la arrastrada, 1:1, partiendo del ancho guardado o, si no
 * hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 *
 * Teclado (v0.9.7, LIST-4): el asa `'end'` es un `role="separator"` enfocable
 * (`aria-orientation="vertical"`, `aria-label` = `labels.columnResize(columna
 * que controla)`, `aria-valuenow/min/max` en px de esa columna). ←/→ mueven el
 * borde 16 px (1 rem) EN PANTALLA, Mayús+←/→ 64 px (en el último borde, ←
 * agranda la última); se ve en vivo y se guarda al soltar la tecla (o al
 * perder el foco), por el mismo `onColumnWidthsChange` que el arrastre y con
 * el mismo suelo. Escape, Supr o Retroceso borran el ancho guardado de la
 * columna que controla, como el doble clic. La mitad `'start'` no es
 * enfocable (sería el mismo borde dos veces en el Tab).
 */
export function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns,
  containerWidth,
  leadingWidth = 0,
  legacyWidths = false,
  labels: labelsProp,
}: {
  columnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /** Columnas VISIBLES, en orden: activa el modelo proporcional. */
  columns?: SizedColumn[]
  /**
   * Ancho (px) del contenedor de la `<table>` (v0.9.8). Con él, las columnas
   * encogen en proporción (hasta su suelo) cuando no caben, en vez de dar
   * scroll, y el arrastre sabe la escala. Sin él (o 0, como en jsdom), cada
   * `<col>` lleva su base y la tabla mide como mínimo la suma.
   * `ResponsiveList` lo mide con un ResizeObserver.
   */
  containerWidth?: number
  /** Px de columnas fuera de `columns`, DELANTE (p. ej. la de selección). */
  leadingWidth?: number
  /**
   * `columnWidths` viene de antes de 0.9.9 (sin `widthsV: 2`; v0.9.10,
   * UI-RESIZE-2): se lee con techo y la primera escritura lo guarda limitado.
   * `useListView` lo pasa en `listProps.columnWidthsLegacy`.
   */
  legacyWidths?: boolean
  /** Textos propios (`columnResize`); ganan al `UiProvider`. */
  labels?: Partial<Labels>
}) {
  const labels = useLabels(labelsProp)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragRef | null>(null)
  // Teclado (v0.9.7): ancho en curso de ←/→ sobre el asa enfocada. Vive en
  // `drag` (en vivo) y se guarda al soltar la tecla o al perder el foco: una
  // tecla mantenida son decenas de `keydown` y una sola escritura. Guarda
  // también la geometría de partida y el delta EN PANTALLA.
  const keyRef = React.useRef<{ geo: ResizeGeo; dx: number; width: number } | null>(null)

  const colOf = (key: string) => columns?.find((c) => c.key === key)
  const container = containerWidth && containerWidth > 0 ? containerWidth : null

  // Relleno LIBRE: la primera `fill` sin ancho guardado. Mientras se
  // arrastra ella misma, ya es una columna normal.
  const restingFillKey = columns ? resolveFillColumnKey(columns, columnWidths) : undefined
  const fillKey = drag?.key === restingFillKey ? undefined : restingFillKey
  const fillIndex = fillKey ? columns!.findIndex((c) => c.key === fillKey) : -1

  /**
   * Techo de un ancho guardado VIEJO (v0.9.10, UI-RESIZE-2; con
   * `legacyWidths`, `columns` y el contenedor medido): lo mayor entre 1,5 ×
   * su ancho de serie y lo que le dejan las demás a su ancho de serie (o a su
   * base, si es menor) dentro del contenedor. Nunca por debajo de su suelo.
   * Sin anchos viejos o sin contenedor, sin techo.
   */
  function capOf(key: string): number {
    const col = colOf(key)
    if (!legacyWidths || !col || container == null) return Infinity
    const own = resolveColumnWidth(col, undefined)
    let others = 0
    for (const c of columns!) {
      if (c.key === key) continue
      const stored = columnWidths?.[c.key]
      const def = resolveColumnWidth(c, undefined)
      others += stored != null ? Math.min(resolveColumnWidth(c, stored), def) : def
    }
    return Math.floor(
      Math.max(own * STORED_WIDTH_MAX_FACTOR, container - leadingWidth - others, columnFloor(col)),
    )
  }

  /**
   * Ancho efectivo sin arrastre (con `columns`): guardado/`width`/defecto, con
   * suelo y, si viene guardado, con techo (`capOf`).
   */
  function baseWidth(key: string): number | undefined {
    const col = colOf(key)
    if (!col) return columnWidths?.[key]
    const stored = columnWidths?.[key]
    const base = resolveColumnWidth(col, stored)
    return stored != null ? Math.min(base, capOf(key)) : base
  }

  /** Ancho vigente de una columna: el del arrastre en curso, o el guardado. */
  function widthOf(key: string): number | undefined {
    return drag?.key === key ? drag.width : columnWidths?.[key]
  }

  /** Base de la columna en el modelo: la del arrastre en curso o la efectiva. */
  function liveWidth(key: string): number | undefined {
    return drag?.key === key ? drag.width : baseWidth(key)
  }

  /**
   * Columna que controla el asa del borde derecho de `columnKey`: ella misma,
   * salvo que sea la penúltima, cuyo borde controla la última (v0.9.9).
   */
  function controlledBy(columnKey: string): string {
    if (!columns || columns.length < 2) return columnKey
    const i = columns.findIndex((c) => c.key === columnKey)
    return i >= 0 && i === columns.length - 2 ? columns[i + 1].key : columnKey
  }

  /**
   * Modelo actual (o con la columna `key` a base `v`, para simular un
   * arrastre). Arrastrar el relleno libre lo hace columna normal (`fill` -1).
   */
  function layoutWith(key?: string, v?: number, at: number | null = container, extra = leadingWidth): Layout {
    const cols = columns ?? []
    const bases = cols.map((c) => (c.key === key ? v! : (liveWidth(c.key) ?? 0)))
    const floors = cols.map(columnFloor)
    const defaults = cols.map((c) => resolveColumnWidth(c, undefined))
    return {
      bases,
      floors,
      fill: key != null && key === restingFillKey ? -1 : fillIndex,
      extra,
      container: at,
      minTotal: minColumns(bases, defaults, floors),
      canShrink: container != null,
    }
  }

  const current = columns ? layoutWith() : null
  // Con contenedor y sin sitio, cada `<col>` lleva su ancho en pantalla
  // (calculado aquí): table-fixed no sabe encoger columnas.
  const painted = current && container != null ? paint(current) : null
  const scaled = painted?.scaled ? painted : null

  /**
   * Ancho para el `<col>`: la base de cada columna; la de relleno libre,
   * ninguno (`undefined`): table-fixed le da todo el sobrante. Si las
   * columnas no caben y encogen, su ancho en pantalla.
   */
  function colWidth(key: string): number | undefined {
    if (scaled) {
      const i = columns!.findIndex((c) => c.key === key)
      if (i >= 0) return scaled.widths[i]
    }
    if (key === fillKey) return undefined
    return liveWidth(key)
  }

  /** Suma de las bases de `columns` (relleno libre incluido, con su base). */
  const totalWidth = columns
    ? columns.reduce((sum, c) => sum + (liveWidth(c.key) ?? 0), 0)
    : undefined

  /**
   * Estilo de la `<table>` para `extra` px fuera de `columns` (p. ej. una
   * columna de selección). Su `min-width` (donde empieza el scroll): con
   * contenedor, `minColumns`; sin él, la suma de bases.
   */
  function tableStyle(extra = leadingWidth): React.CSSProperties | undefined {
    if (totalWidth == null) return undefined
    const min = current && container != null ? current.minTotal : totalWidth
    return tableSizing(min + extra, !!fillKey)
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
   * Geometría de partida de un arrastre o de una tecla sobre el asa del borde
   * derecho de `handleKey` (v0.9.9). Controla `controlledBy(handleKey)`. Parte
   * de su base; el relleno libre, de su ancho PINTADO (sin saltos). El delta
   * en pantalla se pasa a base con el modelo (`baseFor`).
   *
   * Sin `columns` (tablas a mano antiguas): ancho guardado o medido, 1:1.
   */
  function geometryOf(handleKey: string, handle: Element, edge: 'end' | 'start', max: number): ResizeGeo {
    const table = handle.closest('table')
    const key = controlledBy(handleKey)
    const min = floorOf(key)
    const index = columns ? columns.findIndex((c) => c.key === key) : -1
    const measured = () => headOf(handle, key, edge)?.getBoundingClientRect().width || 0
    if (!columns || index < 0) {
      const start = columnWidths?.[key] ?? measured()
      return { key, index, min, max: Math.max(max, start), start, at: null, follow: 'width', ref0: start }
    }
    // Columna extra (selección): la que diga el consumidor o, en tablas a
    // mano sin contenedor, la diferencia entre el `min-width` pintado y la
    // suma de `columns`.
    const minW = table instanceof HTMLElement ? parseFloat(table.style.minWidth) : NaN
    const extra =
      leadingWidth ||
      (container == null && minW > 0 && totalWidth != null ? Math.max(0, minW - totalWidth) : 0)
    const C = container ?? stretchedWidth(table)
    const isFill = key === restingFillKey
    let start = baseWidth(key)!
    if (isFill) {
      // Ancho pintado del relleno libre: el del modelo si se sabe el
      // contenedor; si no, el medido del `<th>`.
      start = C != null ? paint(layoutWith(undefined, undefined, C, extra)).widths[index] : measured() || start
    }
    const at = (v: number) => layoutWith(key, v, C, extra)
    // El último borde (que controla la última) sigue su ancho al revés; el
    // asa propia de la última (tablas a mano: su borde es el del contenedor)
    // y las columnas tras un relleno libre (su borde no se mueve mientras el
    // relleno absorbe) siguen su ancho; las demás, su borde derecho.
    const follow: ResizeGeo['follow'] =
      key !== handleKey
        ? 'width-rev'
        : index === columns.length - 1 || (fillIndex >= 0 && !isFill && index > fillIndex)
          ? 'width'
          : 'edge'
    const p = paint(at(start))
    return {
      key,
      index,
      min,
      max: Math.max(max, start),
      start,
      at,
      follow,
      ref0: follow === 'edge' ? edgeAt(p, index) : p.widths[index],
    }
  }

  function floorOf(columnKey: string): number {
    const col = colOf(columnKey)
    return col ? columnFloor(col) : MIN_COLUMN_WIDTH
  }

  /**
   * Anchos guardados tal como se reescriben: con anchos viejos, LIMITADOS
   * (lo que se ve; UI-RESIZE-2), para que al ponerles la marca no vuelvan a
   * apretar. Si no, tal cual.
   */
  function storedForWrite(): Record<string, number> {
    if (!legacyWidths || !columnWidths) return { ...columnWidths }
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(columnWidths)) {
      const cap = capOf(k)
      out[k] = Number.isFinite(cap) ? Math.min(v, cap) : v
    }
    return out
  }

  /** Guarda `px` para `key` (si cambia), igual que al soltar un arrastre. */
  function commit(key: string, px: number) {
    if (columnWidths?.[key] === px && !legacyWidths) return
    onColumnWidthsChange?.({ ...storedForWrite(), [key]: px })
  }

  /** Borra el ancho guardado de `key`: vuelve a su ancho de serie (doble clic, Escape/Supr). */
  function restore(key: string) {
    const next = storedForWrite()
    delete next[key]
    onColumnWidthsChange?.(next)
  }

  /** Guarda el ancho de teclado pendiente, si lo hay. */
  function flushKey() {
    const k = keyRef.current
    if (!k) return
    keyRef.current = null
    setDrag(null)
    if (k.dx !== 0) commit(k.geo.key, k.width)
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
   * `columnKey` es la columna a la IZQUIERDA del borde. El asa controla esa
   * columna, salvo en el último borde (`columnKey` penúltima), que controla la
   * última (v0.9.9).
   *
   * `edge` (v0.9.3): `'end'` (por defecto) es el asa de siempre, en el borde
   * derecho de la propia `<th>` de `columnKey`. `'start'` es la otra mitad de
   * la zona de agarre: va en el borde IZQUIERDO de la `<th>` SIGUIENTE y es el
   * mismo borde (el derecho de `columnKey`). Hace falta porque la `<th>` lleva
   * `overflow-hidden` (no se puede sacar el asa por fuera) y, desde que las
   * cabeceras se arrastran para reordenar (v0.9.0), fallar el asa por 1 px a la
   * derecha de la línea agarraba la cabecera vecina y la MOVÍA. Con las dos
   * mitades la zona queda centrada en la línea, como en Excel. Sin línea
   * propia (la pinta el asa `'end'`), solo se resalta al pasar por encima.
   *
   * `name` (v0.9.7): nombre de la columna QUE CONTROLA el asa, para su
   * `aria-label`. Por defecto, el texto de su `header` en `columns` o, si no,
   * su clave.
   */
  function resizeHandle(columnKey: string, edge: 'end' | 'start' = 'end', name?: string) {
    const target = controlledBy(columnKey)
    // Solo el asa `'end'` es enfocable: la `'start'` es el mismo borde (otra
    // mitad de la zona de agarre) y sería una parada de Tab repetida.
    const focusable = edge === 'end'
    const now = focusable ? liveWidth(target) : undefined
    const a11y: React.HTMLAttributes<HTMLSpanElement> = focusable
      ? {
          role: 'separator',
          tabIndex: 0,
          'aria-orientation': 'vertical',
          'aria-label': labels.columnResize(nameOf(target, name)),
          'aria-valuenow': now,
          'aria-valuemin': floorOf(target),
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
                  // Los pasos son px EN PANTALLA (v0.9.8, UI-9): el borde se
                  // mueve 16 px, no 16 × escala.
                  const step = e.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP
                  const cur =
                    keyRef.current?.geo.key === target
                      ? keyRef.current
                      : {
                          geo: geometryOf(columnKey, e.currentTarget, edge, RESIZE_KEY_MAX),
                          dx: 0,
                          width: baseWidth(target) ?? 0,
                        }
                  const width = baseFor(cur.geo, cur.dx + (e.key === 'ArrowRight' ? step : -step))
                  // Se acumula lo que se movió de verdad (no las teclas): en el
                  // suelo o el techo la tecla contraria responde a la primera.
                  keyRef.current =
                    width === cur.width ? cur : { geo: cur.geo, dx: screenDelta(cur.geo, width), width }
                  setDrag({ key: target, width })
                  return
                }
                if (e.key === 'Escape' || e.key === 'Delete' || e.key === 'Backspace') {
                  e.preventDefault()
                  e.stopPropagation()
                  keyRef.current = null
                  setDrag(null)
                  if (columnWidths?.[target] != null) restore(target)
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
            // El ratón no tiene techo (salvo el de las demás en su suelo).
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
          commit(d.geo.key, baseFor(d.geo, e.clientX - d.startX))
        }}
        onPointerCancel={() => {
          dragRef.current = null
          setDrag(null)
        }}
        // Doble clic en el asa: la columna que controla vuelve a su ancho de
        // serie (se borra la preferencia, no se guarda un ancho "por defecto").
        onDoubleClick={() => restore(target)}
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

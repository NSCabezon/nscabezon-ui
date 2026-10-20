import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ACTION_COLUMN_WIDTH,
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  columnFloor,
  isFillColumn,
  resolveColumnWidth,
  resolveFillColumnKey,
  tableSizing,
} from './columnWidth'

// Modelo «como Excel + relleno» (v0.9.0): todas las columnas tienen ancho
// efectivo, la de relleno la marca el consumidor y la tabla mide
// máx(contenedor, suma).
describe('resolveFillColumnKey', () => {
  it('la primera marcada con `fill`', () => {
    expect(
      resolveFillColumnKey([{ key: 'n', primary: true }, { key: 'desc', fill: true }, { key: 'x', fill: true }]),
    ).toBe('desc')
  })
  it('`flex` (v0.5.0) es alias de `fill`', () => {
    expect(resolveFillColumnKey([{ key: 'n' }, { key: 'desc', flex: true }])).toBe('desc')
    expect(isFillColumn({ flex: true })).toBe(true)
    expect(isFillColumn({ fill: false, flex: true })).toBe(false)
  })
  it('sin marca NO hay relleno: ni la primary ni la primera sin `width`', () => {
    expect(resolveFillColumnKey([{ key: 'num', primary: true }, { key: 'desc' }])).toBeUndefined()
  })
})

describe('resolveColumnWidth', () => {
  it('guardado > `width` > por defecto (160; 56 para la action sin cabecera)', () => {
    expect(resolveColumnWidth({ width: 120 }, 200)).toBe(200)
    expect(resolveColumnWidth({ width: 120 }, undefined)).toBe(120)
    expect(resolveColumnWidth({}, undefined)).toBe(DEFAULT_COLUMN_WIDTH)
    expect(resolveColumnWidth({ action: true }, undefined)).toBe(DEFAULT_ACTION_COLUMN_WIDTH)
    expect(resolveColumnWidth({ action: true, header: 'Pres.' }, undefined)).toBe(DEFAULT_COLUMN_WIDTH)
  })
  it('lo guardado por debajo de `minWidth` sube al mínimo; por encima, se respeta', () => {
    expect(resolveColumnWidth({ width: 135, minWidth: 131 }, 105)).toBe(131)
    expect(resolveColumnWidth({ width: 135, minWidth: 131 }, 200)).toBe(200)
    expect(resolveColumnWidth({ width: 135, minWidth: 131 }, undefined)).toBe(135)
  })
  it('sin `minWidth`, suelo de 64 (prefs viejas con anchos raros)', () => {
    expect(resolveColumnWidth({ width: 120 }, 12)).toBe(MIN_COLUMN_WIDTH)
    expect(resolveColumnWidth({}, 900)).toBe(900)
  })
})

describe('columnFloor', () => {
  it('`minWidth`, o 64, o el propio ancho si es menor (iconos)', () => {
    expect(columnFloor({ minWidth: 131 })).toBe(131)
    expect(columnFloor({ width: 200 })).toBe(MIN_COLUMN_WIDTH)
    expect(columnFloor({ width: 40 })).toBe(40)
    expect(columnFloor({ action: true })).toBe(DEFAULT_ACTION_COLUMN_WIDTH)
  })
})

describe('tableSizing', () => {
  it('con relleno: 100 % con la suma como mínimo; sin relleno: la suma exacta', () => {
    expect(tableSizing(800, true)).toEqual({ width: '100%', minWidth: 800 })
    expect(tableSizing(800, false)).toEqual({ width: 800 })
  })
})

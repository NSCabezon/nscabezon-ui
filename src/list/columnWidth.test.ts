import { describe, expect, it } from 'vitest'

import { flexAbsorberKey, resolveFlexColumnKey } from './columnWidth'

// Regla de la columna flexible (v0.5.0): la única que gana o pierde ancho al
// arrastrar otra o al cambiar el ancho de la ventana.
describe('resolveFlexColumnKey', () => {
  it('gana la marcada con `flex`, aunque tenga `width` y no sea la primary', () => {
    expect(
      resolveFlexColumnKey([
        { key: 'name', primary: true },
        { key: 'notes', width: 200, flex: true },
      ]),
    ).toBe('notes')
  })

  it('sin marca: la primary si no tiene `width`', () => {
    expect(
      resolveFlexColumnKey([
        { key: 'ref' },
        { key: 'name', primary: true },
      ]),
    ).toBe('name')
  })

  it('primary con `width`: la primera columna no-action sin `width`', () => {
    expect(
      resolveFlexColumnKey([
        { key: 'name', primary: true, width: 120 },
        { key: 'menu', action: true },
        { key: 'desc' },
        { key: 'notes' },
      ]),
    ).toBe('desc')
  })

  it('todas con `width`: ninguna (comportamiento anterior)', () => {
    expect(
      resolveFlexColumnKey([
        { key: 'name', primary: true, width: 120 },
        { key: 'total', width: 90 },
      ]),
    ).toBeUndefined()
  })
})

describe('flexAbsorberKey', () => {
  it('la última no-action sin `width` distinta de la flexible', () => {
    expect(
      flexAbsorberKey(
        [
          { key: 'name' },
          { key: 'client' },
          { key: 'total', width: 90 },
          { key: 'notes' },
          { key: 'menu', action: true },
        ],
        'name',
      ),
    ).toBe('notes')
  })

  it('si todas las demás tienen `width`: la vecina de la derecha', () => {
    expect(
      flexAbsorberKey(
        [
          { key: 'ref', width: 100 },
          { key: 'name' },
          { key: 'total', width: 90 },
        ],
        'name',
      ),
    ).toBe('total')
  })

  it('flexible al final y sin libres: ninguna', () => {
    expect(flexAbsorberKey([{ key: 'ref', width: 100 }, { key: 'name' }], 'name')).toBeUndefined()
  })
})

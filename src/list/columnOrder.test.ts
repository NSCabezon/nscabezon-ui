import { describe, expect, it } from 'vitest'

import { moveColumn, orderColumns } from './columnOrder'

const cols = [
  { key: 'a' },
  { key: 'b' },
  { key: 'menu', action: true },
  { key: 'c' },
]
const keys = (cs: { key: string }[]) => cs.map((c) => c.key)

describe('orderColumns', () => {
  it('sin orden devuelve el mismo array', () => {
    expect(orderColumns(cols, [])).toBe(cols)
    expect(orderColumns(cols, undefined)).toBe(cols)
  })

  it('reordena las normales y deja las action en su sitio; desconocidas fuera, faltantes detrás', () => {
    expect(keys(orderColumns(cols, ['c', 'ghost', 'a']))).toEqual(['c', 'a', 'menu', 'b'])
    expect(keys(orderColumns(cols, ['menu', 'b', 'c', 'a']))).toEqual(['b', 'c', 'menu', 'a'])
  })
})

describe('moveColumn', () => {
  it('detrás del destino si venía de la izquierda, delante si venía de la derecha', () => {
    expect(moveColumn(cols, [], 'a', 'c')).toEqual(['b', 'c', 'menu', 'a'])
    expect(moveColumn(cols, [], 'c', 'a')).toEqual(['c', 'a', 'menu', 'b'])
  })

  it('las action ni se mueven ni son destino; mover sobre sí misma no hace nada', () => {
    expect(moveColumn(cols, [], 'menu', 'a')).toBeNull()
    expect(moveColumn(cols, [], 'a', 'menu')).toBeNull()
    expect(moveColumn(cols, [], 'a', 'a')).toBeNull()
  })
})

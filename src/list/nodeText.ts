import * as React from 'react'

// Texto plano de una cabecera (para nombres accesibles: «Subir»/«Bajar» del
// menú de columnas, asa de redimensionar): las cabeceras suelen ser cadenas,
// pero pueden ser nodos con texto dentro.
export function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return nodeText(node.props.children)
  }
  return ''
}

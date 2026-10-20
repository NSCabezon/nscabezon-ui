import * as React from 'react'

// Modo compacto del `ResponsiveList` que pinta la celda. Lo provee la propia
// lista (tabla y tarjetas), así que una `cell` puede adaptar su contenido
// (una línea, chips resumidos…) sin recibir el modo por props.
const ListCompactContext = React.createContext(false)

export const ListCompactProvider = ListCompactContext.Provider

/** `true` dentro de un `ResponsiveList` en modo compacto; `false` fuera o en modo normal. */
export function useListCompact(): boolean {
  return React.useContext(ListCompactContext)
}

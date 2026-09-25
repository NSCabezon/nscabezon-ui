// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UiProvider, defaultLabels, useUi, type UiContextValue, type UiLinkProps } from './UiProvider'
import { localOnlyListPrefsStore } from '../prefs/stores'
import { Pagination } from '../list/pagination'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
const seen: UiContextValue[] = []

// Hijo memoizado: solo vuelve a renderizar si cambia el contexto.
const Probe = React.memo(function Probe() {
  seen.push(useUi())
  return null
})

function LinkA(props: UiLinkProps) {
  return <a {...props} />
}
function LinkB(props: UiLinkProps) {
  return <a {...props} />
}

type HostProps = {
  Link?: React.ComponentType<UiLinkProps>
  onNavigate: (href: string) => void
  message?: string
  suffix?: string
  store?: typeof localOnlyListPrefsStore
}

// Props en línea a propósito: flecha nueva y objeto `labels` nuevo en cada render.
function Host({ Link = LinkA, onNavigate, message = 'Nueva versión', suffix = '', store }: HostProps) {
  return (
    <UiProvider
      Link={Link}
      navigate={(href) => onNavigate(href)}
      labels={{
        versionMessage: message,
        count: (n) => `${n} filas${suffix}`,
      }}
      listPrefsStore={store}
    >
      <Probe />
    </UiProvider>
  )
}

function render(ui: React.ReactElement) {
  act(() => {
    root.render(ui)
  })
}

beforeEach(() => {
  seen.length = 0
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('UiProvider (estabilidad del contexto)', () => {
  it('navigate y labels en línea no cambian el valor del contexto entre renders', () => {
    const nav = vi.fn()
    render(<Host onNavigate={nav} />)
    render(<Host onNavigate={nav} />)
    render(<Host onNavigate={nav} />)
    expect(seen).toHaveLength(1)
    expect(seen[0].labels.versionMessage).toBe('Nueva versión')
    expect(seen[0].labels.count(3)).toBe('3 filas')
    // El resto, los de por defecto.
    expect(seen[0].labels.columnsMenu).toBe(defaultLabels.columnsMenu)
  })

  it('el navigate estable llama siempre a la última función recibida', () => {
    const first = vi.fn()
    const second = vi.fn()
    render(<Host onNavigate={first} />)
    render(<Host onNavigate={second} />)
    expect(seen).toHaveLength(1)
    seen[0].navigate('/x')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('/x')
  })

  it('las etiquetas-función estables delegan en la última versión', () => {
    const nav = vi.fn()
    render(<Host onNavigate={nav} />)
    render(<Host onNavigate={nav} suffix="!" />)
    expect(seen).toHaveLength(1)
    expect(seen[0].labels.count(2)).toBe('2 filas!')
  })

  it('cambia cuando cambia el contenido de labels', () => {
    const nav = vi.fn()
    render(<Host onNavigate={nav} />)
    render(<Host onNavigate={nav} message="Otra" />)
    expect(seen).toHaveLength(2)
    expect(seen[1].labels.versionMessage).toBe('Otra')
    expect(seen[1].navigate).toBe(seen[0].navigate)
  })

  it('cambia cuando cambian Link o listPrefsStore', () => {
    const nav = vi.fn()
    render(<Host onNavigate={nav} />)
    render(<Host onNavigate={nav} Link={LinkB} />)
    expect(seen).toHaveLength(2)
    expect(seen[1].Link).toBe(LinkB)
    render(<Host onNavigate={nav} Link={LinkB} store={localOnlyListPrefsStore} />)
    expect(seen).toHaveLength(3)
    expect(seen[2].listPrefsStore).toBe(localOnlyListPrefsStore)
  })

  it('sin navigate usa location.assign', () => {
    render(
      <UiProvider>
        <Probe />
      </UiProvider>,
    )
    const assign = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, assign },
    })
    try {
      seen[0].navigate('/y')
      expect(assign).toHaveBeenCalledWith('/y')
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original })
    }
  })
})

describe('defaultLabels (paginación)', () => {
  it('los botones de paginación dicen «Primera/Anterior/Siguiente/Última página»', () => {
    expect(defaultLabels.paginationFirst).toBe('Primera página')
    expect(defaultLabels.paginationPrev).toBe('Página anterior')
    expect(defaultLabels.paginationNext).toBe('Página siguiente')
    expect(defaultLabels.paginationLast).toBe('Última página')
    render(<Pagination page={2} pageSize={10} total={50} onPageChange={() => {}} />)
    const names = Array.from(container.querySelectorAll('button')).map((b) =>
      b.getAttribute('aria-label'),
    )
    expect(names).toEqual(['Primera página', 'Página anterior', 'Página siguiente', 'Última página'])
  })
})

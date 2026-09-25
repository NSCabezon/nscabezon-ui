import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseVersionCheckOptions } from './useVersionCheck'

vi.mock('sonner', () => ({ toast: vi.fn() }))

function jsonResponse(body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': contentType },
  })
}

let root: Root | null = null
let host: HTMLElement | null = null
let rerender: (options: UseVersionCheckOptions) => void = () => {}

// Estado a nivel de módulo (versión avisada, última comprobación): se resetea
// reimportando el módulo con `vi.resetModules()`, para que los tests no se
// contaminen entre sí. sonner se importa ANTES que el hook para que los dos
// resuelvan la misma instancia del mock.
async function mountHook(options: UseVersionCheckOptions) {
  vi.resetModules()
  const { toast } = await import('sonner')
  const { useVersionCheck } = await import('./useVersionCheck')
  function Host(props: UseVersionCheckOptions) {
    useVersionCheck(props)
    return null
  }
  host = document.createElement('div')
  document.body.appendChild(host)
  await act(async () => {
    root = createRoot(host!)
    root.render(<Host {...options} />)
    // Flush del `check()` inmediato al montar.
    await vi.advanceTimersByTimeAsync(0)
  })
  rerender = (next) => act(() => root!.render(<Host {...next} />))
  return { toast: toast as unknown as ReturnType<typeof vi.fn> }
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  host?.remove()
  host = null
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('useVersionCheck', () => {
  it('comprueba al montar y ofrece el toast (textos en español por defecto) cuando la versión difiere', async () => {
    const fetchVersion = vi.fn(async () => 'nueva')
    const { toast } = await mountHook({ fetchVersion, currentVersion: 'vieja' })

    expect(fetchVersion).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledWith(
      'Hay una versión nueva de la aplicación',
      expect.objectContaining({
        duration: Infinity,
        position: 'top-center',
        action: expect.objectContaining({ label: 'Actualizar' }),
      }),
    )
  })

  it('usa los textos y onReload que se le pasan', async () => {
    const onReload = vi.fn()
    const { toast } = await mountHook({
      fetchVersion: async () => 'nueva',
      currentVersion: 'vieja',
      labels: { versionMessage: 'New version', versionAction: 'Reload' },
      onReload,
    })
    expect(toast).toHaveBeenCalledWith(
      'New version',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Reload' }) }),
    )
    const action = toast.mock.calls[0][1].action as { onClick: () => void }
    action.onClick()
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('no avisa cuando la versión coincide, ni si fetchVersion devuelve null o lanza', async () => {
    const { toast } = await mountHook({ fetchVersion: async () => 'v1', currentVersion: 'v1' })
    expect(toast).not.toHaveBeenCalled()

    act(() => root?.unmount())
    const second = await mountHook({ fetchVersion: async () => null, currentVersion: 'v1' })
    expect(second.toast).not.toHaveBeenCalled()

    act(() => root?.unmount())
    const third = await mountHook({
      fetchVersion: async () => {
        throw new Error('red')
      },
      currentVersion: 'v1',
    })
    expect(third.toast).not.toHaveBeenCalled()
  })

  it('con enabled=false no consulta nada', async () => {
    const fetchVersion = vi.fn(async () => 'nueva')
    const { toast } = await mountHook({ fetchVersion, currentVersion: 'v1', enabled: false })
    await advance(20 * 60_000)
    expect(fetchVersion).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  // Regresión (Gesmoto): con `t` de i18n en las deps del efecto, cada namespace
  // cargado bajo demanda reiniciaba el `setInterval` de 5 min y el poll no se
  // cumplía nunca. Aquí: cambiar textos/función en cada render no lo reinicia.
  it('el poll de 5 min sobrevive a re-renders con textos y fetchVersion nuevos cada 4 min', async () => {
    let calls = 0
    const make = () => async () => {
      calls++
      return 'v1'
    }
    await mountHook({ fetchVersion: make(), currentVersion: 'v1' })
    expect(calls).toBe(1)
    for (let i = 1; i <= 5; i++) {
      await advance(4 * 60_000)
      rerender({
        fetchVersion: make(),
        currentVersion: 'v1',
        labels: { versionMessage: `m${i}`, versionAction: `a${i}` },
      })
    }
    // 20 min: comprobación inicial + ticks en 5/10/15/20.
    expect(calls).toBe(5)
  })

  it('vuelve a avisar con una versión posterior, pero no dos veces la misma', async () => {
    let call = 0
    const fetchVersion = vi.fn(async () => (++call === 1 ? 'primera' : 'segunda'))
    const { toast } = await mountHook({ fetchVersion, currentVersion: 'v0' })
    await advance(0)
    expect(toast).toHaveBeenCalledTimes(1)
    await advance(5 * 60_000)
    expect(toast).toHaveBeenCalledTimes(2)
    await advance(5 * 60_000)
    expect(toast).toHaveBeenCalledTimes(2)
  })

  it('al recuperar el foco comprueba, con throttle de 1 min', async () => {
    const fetchVersion = vi.fn(async () => 'v1')
    await mountHook({ fetchVersion, currentVersion: 'v1' })
    expect(fetchVersion).toHaveBeenCalledTimes(1)
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(fetchVersion).toHaveBeenCalledTimes(1)
    await advance(61_000)
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(fetchVersion).toHaveBeenCalledTimes(2)
  })
})

describe('fetchVersionJson', () => {
  it('lee { version } sin caché y descarta lo que no es JSON válido', async () => {
    const { fetchVersionJson } = await import('./useVersionCheck')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ version: 'abc' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchVersionJson('/version.json')).resolves.toBe('abc')
    expect(fetchMock).toHaveBeenCalledWith('/version.json', { cache: 'no-store' })

    fetchMock.mockResolvedValueOnce(jsonResponse({ version: 'abc' }, 'text/html'))
    await expect(fetchVersionJson('/version.json')).resolves.toBeNull()
    fetchMock.mockResolvedValueOnce(jsonResponse({ version: '' }))
    await expect(fetchVersionJson('/version.json')).resolves.toBeNull()
    fetchMock.mockResolvedValueOnce(new Response('x', { status: 500 }))
    await expect(fetchVersionJson('/version.json')).resolves.toBeNull()
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await expect(fetchVersionJson('/version.json')).resolves.toBeNull()
  })
})

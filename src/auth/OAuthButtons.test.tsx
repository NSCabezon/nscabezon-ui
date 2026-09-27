// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { OAuthButtons, type OAuthSignInClient } from './OAuthButtons'
import { DEFAULT_LAST_AUTH_METHOD_KEY, getLastAuthMethod } from './lastAuthMethod'
import { UiProvider } from '../context/UiProvider'

type SignIn = OAuthSignInClient['auth']['signInWithOAuth']

function makeClient(result: Awaited<ReturnType<SignIn>> = { error: null }) {
  const signInWithOAuth = vi.fn<SignIn>().mockResolvedValue(result)
  const client: OAuthSignInClient = { auth: { signInWithOAuth } }
  return { client, signInWithOAuth }
}

const buttons = () => screen.getAllByRole<HTMLButtonElement>('button')
const button = (provider: 'google' | 'apple') =>
  document.querySelector<HTMLButtonElement>(`button[data-provider="${provider}"]`)!

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('OAuthButtons', () => {
  it('pinta Google y Apple, en ese orden, con los textos por defecto y el separador', () => {
    const { client } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/auth/callback" />)
    const all = buttons()
    expect(all).toHaveLength(2)
    expect(all[0].dataset.provider).toBe('google')
    expect(all[0].textContent).toBe('Continuar con Google')
    expect(all[1].dataset.provider).toBe('apple')
    expect(all[1].textContent).toBe('Continuar con Apple')
    expect(all.every((b) => b.getAttribute('type') === 'button')).toBe(true)
    expect(screen.getByText('o continúa con')).toBeTruthy()
    // Iconos: Google a color, Apple en currentColor; ambos decorativos.
    const svgs = document.querySelectorAll('svg')
    expect(svgs).toHaveLength(2)
    expect(svgs[0].getAttribute('aria-hidden')).toBe('true')
    expect(svgs[0].querySelector('path')!.getAttribute('fill')).toBe('#4285F4')
    expect(svgs[1].getAttribute('fill')).toBe('currentColor')
    expect(svgs[1].classList.contains('size-4')).toBe(true)
  })

  it('toma los textos del UiProvider y la prop labels gana', () => {
    const { client } = makeClient()
    render(
      <UiProvider
        labels={{
          oauthDivider: 'or continue with',
          oauthGoogle: 'Continue with Google',
          oauthApple: 'Continue with Apple',
          lastUsed: 'Last time',
        }}
      >
        <OAuthButtons
          client={client}
          redirectTo="https://app.test/cb"
          lastMethod="google"
          labels={{ oauthApple: 'Apple ID' }}
        />
      </UiProvider>,
    )
    expect(screen.getByText('or continue with')).toBeTruthy()
    expect(button('google').textContent).toBe('Continue with GoogleLast time')
    expect(button('apple').textContent).toBe('Apple ID')
  })

  it('divider={false} quita el separador', () => {
    const { client } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" divider={false} />)
    expect(screen.queryByText('o continúa con')).toBeNull()
    expect(buttons()).toHaveLength(2)
  })

  it('al pulsar Google llama a signInWithOAuth con redirectTo (función evaluada al click) y recuerda el método', async () => {
    const { client, signInWithOAuth } = makeClient()
    const redirectTo = vi.fn(() => 'https://app.test/auth/callback?next=/x')
    render(<OAuthButtons client={client} redirectTo={redirectTo} />)
    // La función no se evalúa al renderizar (en SSR no hay window).
    expect(redirectTo).not.toHaveBeenCalled()
    expect(getLastAuthMethod()).toBeNull()

    fireEvent.click(button('google'))

    expect(redirectTo).toHaveBeenCalledTimes(1)
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://app.test/auth/callback?next=/x' },
    })
    expect(getLastAuthMethod()).toBe('google')
    // Mientras redirige, todos los botones quedan deshabilitados.
    expect(buttons().every((b) => b.disabled)).toBe(true)
    await act(async () => {})
    // Sin error no se vuelve a habilitar: el navegador está saliendo al proveedor.
    expect(buttons().every((b) => b.disabled)).toBe(true)
  })

  it('con redirectTo como cadena la pasa tal cual', () => {
    const { client, signInWithOAuth } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" />)
    fireEvent.click(button('apple'))
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: 'https://app.test/cb' },
    })
    expect(getLastAuthMethod()).toBe('apple')
  })

  it('onBeforeRedirect se llama con el proveedor antes de signInWithOAuth', () => {
    const order: string[] = []
    const signInWithOAuth = vi.fn<SignIn>().mockImplementation(async () => {
      order.push('signIn')
      return { error: null }
    })
    const client: OAuthSignInClient = { auth: { signInWithOAuth } }
    const onBeforeRedirect = vi.fn((provider: string) => {
      order.push(`before:${provider}`)
    })
    render(
      <OAuthButtons client={client} redirectTo="https://app.test/cb" onBeforeRedirect={onBeforeRedirect} />,
    )
    fireEvent.click(button('apple'))
    expect(onBeforeRedirect).toHaveBeenCalledWith('apple')
    expect(order).toEqual(['before:apple', 'signIn'])
  })

  it('si signInWithOAuth devuelve error llama a onError y vuelve a habilitar los botones', async () => {
    const error = { message: 'Provider not enabled' }
    const { client } = makeClient({ error })
    const onError = vi.fn()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" onError={onError} />)
    fireEvent.click(button('google'))
    expect(buttons().every((b) => b.disabled)).toBe(true)
    await waitFor(() => expect(onError).toHaveBeenCalledWith(error, 'google'))
    await waitFor(() => expect(buttons().every((b) => !b.disabled)).toBe(true))
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('sin onError, el error va a toast.error de sonner', async () => {
    const { client } = makeClient({ error: { message: 'Boom' } })
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" />)
    fireEvent.click(button('apple'))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Boom'))
    await waitFor(() => expect(buttons().every((b) => !b.disabled)).toBe(true))
  })

  it('lastMethod="apple" pinta «Última vez» solo en Apple', () => {
    const { client } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" lastMethod="apple" />)
    expect(screen.getAllByText('Última vez')).toHaveLength(1)
    expect(button('apple').textContent).toContain('Última vez')
    expect(button('google').textContent).not.toContain('Última vez')
  })

  it('lastMethod="email" no marca ningún botón', () => {
    const { client } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" lastMethod="email" />)
    expect(screen.queryByText('Última vez')).toBeNull()
  })

  it("providers={['google']} pinta solo Google", () => {
    const { client } = makeClient()
    render(<OAuthButtons client={client} redirectTo="https://app.test/cb" providers={['google']} />)
    expect(buttons()).toHaveLength(1)
    expect(button('google')).not.toBeNull()
    expect(document.querySelector('button[data-provider="apple"]')).toBeNull()
  })

  it('rememberLastMethod={false} no escribe en storage', () => {
    const { client, signInWithOAuth } = makeClient()
    render(
      <OAuthButtons client={client} redirectTo="https://app.test/cb" rememberLastMethod={false} />,
    )
    fireEvent.click(button('google'))
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(getLastAuthMethod()).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('rememberLastMethod={{ storageKey }} usa esa clave', () => {
    const { client } = makeClient()
    render(
      <OAuthButtons
        client={client}
        redirectTo="https://app.test/cb"
        rememberLastMethod={{ storageKey: 'gt.lastAuthMethod' }}
      />,
    )
    fireEvent.click(button('apple'))
    expect(getLastAuthMethod('gt.lastAuthMethod')).toBe('apple')
    expect(localStorage.getItem(DEFAULT_LAST_AUTH_METHOD_KEY)).toBeNull()
  })

  it('providerOptions se fusionan en options del proveedor pulsado', () => {
    const { client, signInWithOAuth } = makeClient()
    render(
      <OAuthButtons
        client={client}
        redirectTo="https://app.test/cb"
        providerOptions={{
          google: { scopes: 'email profile', queryParams: { prompt: 'select_account' } },
          apple: { scopes: 'name email' },
        }}
      />,
    )
    fireEvent.click(button('google'))
    expect(signInWithOAuth).toHaveBeenLastCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://app.test/cb',
        scopes: 'email profile',
        queryParams: { prompt: 'select_account' },
      },
    })
  })
})

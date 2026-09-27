import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_LAST_AUTH_METHOD_KEY,
  getLastAuthMethod,
  setLastAuthMethod,
} from './lastAuthMethod'

beforeEach(() => {
  localStorage.clear()
})

describe('lastAuthMethod', () => {
  it('sin dato devuelve null', () => {
    expect(getLastAuthMethod()).toBeNull()
  })

  it('guarda y lee el método con la clave por defecto', () => {
    setLastAuthMethod('google')
    expect(localStorage.getItem(DEFAULT_LAST_AUTH_METHOD_KEY)).toBe('google')
    expect(getLastAuthMethod()).toBe('google')
    setLastAuthMethod('email')
    expect(getLastAuthMethod()).toBe('email')
    setLastAuthMethod('apple')
    expect(getLastAuthMethod()).toBe('apple')
  })

  it('un valor que no es uno de los tres métodos se lee como null', () => {
    localStorage.setItem(DEFAULT_LAST_AUTH_METHOD_KEY, 'facebook')
    expect(getLastAuthMethod()).toBeNull()
    localStorage.setItem(DEFAULT_LAST_AUTH_METHOD_KEY, '')
    expect(getLastAuthMethod()).toBeNull()
  })

  it('acepta una clave personalizada y no toca la por defecto', () => {
    setLastAuthMethod('apple', 'gt.lastAuthMethod')
    expect(getLastAuthMethod('gt.lastAuthMethod')).toBe('apple')
    expect(getLastAuthMethod()).toBeNull()
    expect(localStorage.getItem(DEFAULT_LAST_AUTH_METHOD_KEY)).toBeNull()
  })

  it('no lanza si localStorage falla', () => {
    const original = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    try {
      expect(() => setLastAuthMethod('google')).not.toThrow()
      expect(getLastAuthMethod()).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: original,
      })
    }
  })
})

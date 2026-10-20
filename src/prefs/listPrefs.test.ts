import { describe, expect, it } from 'vitest'
import {
  EMPTY_LIST_PREFS,
  listPrefsEqual,
  normalizeListPrefs,
  resolveListDefaults,
  type ListPrefs,
} from './listPrefs'

const KNOWN = ['number', 'client', 'vehicle', 'status']
const DEFAULTS: ListPrefs = {
  hidden: [],
  widths: {},
  sort: { key: 'number', dir: 'desc' },
  pageSize: 25,
  compact: false,
  order: [],
}

describe('normalizeListPrefs', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const raw of [null, undefined, 'x', 42, [], true]) {
      expect(normalizeListPrefs(raw, KNOWN, DEFAULTS)).toEqual(DEFAULTS)
    }
  })

  it('does not return the defaults object itself (no shared mutation)', () => {
    const out = normalizeListPrefs(null, KNOWN, DEFAULTS)
    expect(out).not.toBe(DEFAULTS)
    expect(out.hidden).not.toBe(DEFAULTS.hidden)
    expect(out.widths).not.toBe(DEFAULTS.widths)
  })

  it('keeps only known hidden columns, without duplicates', () => {
    const out = normalizeListPrefs(
      { hidden: ['client', 'ghost', 'client', 7, 'status'] },
      KNOWN,
      DEFAULTS,
    )
    expect(out.hidden).toEqual(['client', 'status'])
  })

  it('drops unknown keys and non-finite or non-positive widths, rounding the rest', () => {
    const out = normalizeListPrefs(
      {
        widths: {
          client: 120.6,
          ghost: 200,
          vehicle: Number.NaN,
          status: Number.POSITIVE_INFINITY,
          number: -5,
        },
      },
      KNOWN,
      DEFAULTS,
    )
    expect(out.widths).toEqual({ client: 121 })
  })

  it('ignores widths when the field is not an object', () => {
    expect(normalizeListPrefs({ widths: [1, 2] }, KNOWN, DEFAULTS).widths).toEqual({})
    expect(normalizeListPrefs({ widths: 'wide' }, KNOWN, DEFAULTS).widths).toEqual({})
  })

  it('accepts a valid sort and falls back to the default for an invalid one', () => {
    expect(
      normalizeListPrefs({ sort: { key: 'client', dir: 'asc' } }, KNOWN, DEFAULTS).sort,
    ).toEqual({ key: 'client', dir: 'asc' })
    expect(
      normalizeListPrefs({ sort: { key: 'ghost', dir: 'asc' } }, KNOWN, DEFAULTS).sort,
    ).toEqual(DEFAULTS.sort)
    expect(
      normalizeListPrefs({ sort: { key: 'client', dir: 'up' } }, KNOWN, DEFAULTS).sort,
    ).toEqual(DEFAULTS.sort)
    expect(normalizeListPrefs({ sort: null }, KNOWN, DEFAULTS).sort).toEqual(DEFAULTS.sort)
    expect(normalizeListPrefs({}, KNOWN, DEFAULTS).sort).toEqual(DEFAULTS.sort)
  })

  it('accepts only 10/25/50/100 as page size and falls back to the default otherwise', () => {
    expect(normalizeListPrefs({ pageSize: 10 }, KNOWN, DEFAULTS).pageSize).toBe(10)
    expect(normalizeListPrefs({ pageSize: 50 }, KNOWN, DEFAULTS).pageSize).toBe(50)
    expect(normalizeListPrefs({ pageSize: 100 }, KNOWN, DEFAULTS).pageSize).toBe(100)
    for (const bad of [0, 20, 200, -25, '25', null, Number.NaN, undefined]) {
      expect(normalizeListPrefs({ pageSize: bad }, KNOWN, DEFAULTS).pageSize).toBe(25)
    }
    // pageSize is not a column key: knownKeys never filters it out.
    expect(normalizeListPrefs({ pageSize: 50 }, [], DEFAULTS).pageSize).toBe(50)
    // A list may default to another allowed size.
    expect(normalizeListPrefs({}, KNOWN, { ...DEFAULTS, pageSize: 10 }).pageSize).toBe(10)
    // Rows saved before pageSize existed take the list default.
    expect(normalizeListPrefs({ hidden: [] }, KNOWN, { ...DEFAULTS, pageSize: 50 }).pageSize).toBe(
      50,
    )
  })

  it('sanitises the defaults too when a column disappears or the size is retired', () => {
    const stale: ListPrefs = {
      hidden: ['ghost'],
      widths: { ghost: 100, client: 90 },
      sort: { key: 'ghost', dir: 'asc' },
      pageSize: 999,
      compact: 'yes' as unknown as boolean,
      order: [],
    }
    expect(normalizeListPrefs(null, KNOWN, stale)).toEqual({
      hidden: [],
      widths: { client: 90 },
      sort: null,
      pageSize: 25,
      compact: false,
      order: [],
    })
  })

  it('accepts only a boolean as compact and falls back to the default otherwise', () => {
    expect(normalizeListPrefs({ compact: true }, KNOWN, DEFAULTS).compact).toBe(true)
    expect(normalizeListPrefs({ compact: false }, KNOWN, DEFAULTS).compact).toBe(false)
    for (const bad of ['true', 1, 0, null, {}, undefined]) {
      expect(normalizeListPrefs({ compact: bad }, KNOWN, DEFAULTS).compact).toBe(false)
    }
    // Rows saved before compact existed take the list default.
    expect(normalizeListPrefs({ hidden: [] }, KNOWN, { ...DEFAULTS, compact: true }).compact).toBe(
      true,
    )
    // compact is not a column key: knownKeys never filters it out.
    expect(normalizeListPrefs({ compact: true }, [], DEFAULTS).compact).toBe(true)
  })

  it('order: unknown keys out, duplicates out, missing known columns appended at the end', () => {
    expect(
      normalizeListPrefs({ order: ['status', 'ghost', 'client', 'status', 7] }, KNOWN, DEFAULTS)
        .order,
    ).toEqual(['status', 'client', 'number', 'vehicle'])
    // A full valid order stays as is.
    expect(
      normalizeListPrefs({ order: ['vehicle', 'status', 'client', 'number'] }, KNOWN, DEFAULTS)
        .order,
    ).toEqual(['vehicle', 'status', 'client', 'number'])
    // A column added later shows up after the ones the user already placed.
    expect(
      normalizeListPrefs({ order: ['client', 'number', 'status'] }, KNOWN, DEFAULTS).order,
    ).toEqual(['client', 'number', 'status', 'vehicle'])
  })

  it('order: not an array (or nothing known) means factory order []', () => {
    for (const bad of ['client', 1, null, {}, undefined]) {
      expect(normalizeListPrefs({ order: bad }, KNOWN, DEFAULTS).order).toEqual([])
    }
    expect(normalizeListPrefs({ order: ['ghost'] }, KNOWN, DEFAULTS).order).toEqual([])
    expect(normalizeListPrefs({ order: [] }, KNOWN, DEFAULTS).order).toEqual([])
    // Rows saved before order existed take the list default.
    expect(normalizeListPrefs({ hidden: [] }, KNOWN, DEFAULTS).order).toEqual([])
  })

  it('merges a full valid object untouched', () => {
    const raw = {
      hidden: ['vehicle'],
      widths: { client: 140, status: 200 },
      sort: { key: 'status', dir: 'desc' },
      pageSize: 50,
      compact: true,
      order: [],
    }
    expect(normalizeListPrefs(raw, KNOWN, DEFAULTS)).toEqual(raw)
  })
})

describe('listPrefsEqual', () => {
  it('compares structurally', () => {
    const a: ListPrefs = {
      hidden: ['a'],
      widths: { x: 1 },
      sort: { key: 'x', dir: 'asc' },
      pageSize: 25,
      compact: false,
      order: [],
    }
    expect(listPrefsEqual(a, { ...a, widths: { x: 1 } })).toBe(true)
    expect(listPrefsEqual(a, { ...a, pageSize: 50 })).toBe(false)
    expect(listPrefsEqual(a, { ...a, compact: true })).toBe(false)
    expect(listPrefsEqual(a, { ...a, order: ['x'] })).toBe(false)
    expect(listPrefsEqual({ ...a, order: ['x', 'y'] }, { ...a, order: ['y', 'x'] })).toBe(false)
    expect(listPrefsEqual({ ...a, order: ['x', 'y'] }, { ...a, order: ['x', 'y'] })).toBe(true)
    expect(listPrefsEqual(a, { ...a, widths: { x: 2 } })).toBe(false)
    expect(listPrefsEqual(a, { ...a, hidden: [] })).toBe(false)
    expect(listPrefsEqual(a, { ...a, sort: { key: 'x', dir: 'desc' } })).toBe(false)
    expect(listPrefsEqual(a, { ...a, sort: null })).toBe(false)
    expect(listPrefsEqual({ ...a, sort: null }, { ...a, sort: null })).toBe(true)
  })
})

describe('resolveListDefaults', () => {
  it('fills the optional fields: no sort, no hidden, no widths, 25 per page, not compact', () => {
    expect(resolveListDefaults()).toEqual({
      hidden: [],
      widths: {},
      sort: null,
      pageSize: 25,
      compact: false,
      order: [],
    })
    expect(resolveListDefaults({})).toEqual(EMPTY_LIST_PREFS)
    expect(
      resolveListDefaults({ sort: { key: 'a', dir: 'asc' }, hidden: ['a'], widths: { a: 90 }, pageSize: 10 }),
    ).toEqual({
      hidden: ['a'],
      widths: { a: 90 },
      sort: { key: 'a', dir: 'asc' },
      pageSize: 10,
      compact: false,
      order: [],
    })
    expect(resolveListDefaults({ compact: true }).compact).toBe(true)
    expect(resolveListDefaults({ order: ['a', 'b'] }).order).toEqual(['a', 'b'])
  })
})

// src/lib/safeStorage.ts
var safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
    }
  }
};

// src/lib/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/prefs/listPrefs.ts
var LIST_PAGE_SIZES = [10, 25, 50];
var DEFAULT_LIST_PAGE_SIZE = 25;
function isListPageSize(value) {
  return LIST_PAGE_SIZES.includes(value);
}
var LIST_PREFS_STORAGE_PREFIX = "list-prefs:";
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeListPrefs(raw, knownKeys, defaults) {
  const known = new Set(knownKeys);
  const base = {
    hidden: defaults.hidden.filter((k) => known.has(k)),
    widths: cleanWidths(defaults.widths, known),
    sort: cleanSort(defaults.sort, known),
    pageSize: isListPageSize(defaults.pageSize) ? defaults.pageSize : DEFAULT_LIST_PAGE_SIZE
  };
  if (!isRecord(raw)) return base;
  const hidden = Array.isArray(raw.hidden) ? Array.from(
    new Set(raw.hidden.filter((k) => typeof k === "string" && known.has(k)))
  ) : base.hidden;
  const widths = isRecord(raw.widths) ? cleanWidths(raw.widths, known) : base.widths;
  const sort = "sort" in raw ? cleanSort(raw.sort, known) ?? base.sort : base.sort;
  const pageSize = isListPageSize(raw.pageSize) ? raw.pageSize : base.pageSize;
  return { hidden, widths, sort, pageSize };
}
function cleanWidths(raw, known) {
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!known.has(key)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    out[key] = Math.round(value);
  }
  return out;
}
function cleanSort(raw, known) {
  if (!isRecord(raw)) return null;
  const { key, dir } = raw;
  if (typeof key !== "string" || !known.has(key)) return null;
  if (dir !== "asc" && dir !== "desc") return null;
  return { key, dir };
}
function listPrefsEqual(a, b) {
  if (a.hidden.length !== b.hidden.length || a.hidden.some((k, i) => k !== b.hidden[i])) {
    return false;
  }
  const aw = Object.entries(a.widths);
  const bw = Object.entries(b.widths);
  if (aw.length !== bw.length || aw.some(([k, v]) => b.widths[k] !== v)) return false;
  if (a.pageSize !== b.pageSize) return false;
  if (a.sort === null || b.sort === null) return a.sort === b.sort;
  return a.sort.key === b.sort.key && a.sort.dir === b.sort.dir;
}
function resolveListDefaults(defaults = {}) {
  return {
    hidden: defaults.hidden ?? [],
    widths: defaults.widths ?? {},
    sort: defaults.sort ?? null,
    pageSize: defaults.pageSize ?? DEFAULT_LIST_PAGE_SIZE
  };
}
var EMPTY_LIST_PREFS = Object.freeze({
  hidden: [],
  widths: {},
  sort: null,
  pageSize: DEFAULT_LIST_PAGE_SIZE
});

// src/list/columnWidth.ts
var DEFAULT_ACTION_COLUMN_WIDTH = 56;
function resolveColumnWidth(col, stored) {
  return stored ?? col.width ?? (col.action && !col.header ? DEFAULT_ACTION_COLUMN_WIDTH : void 0);
}
function visibleColumnsOf(columns, hidden) {
  return hidden?.length ? columns.filter((c) => c.primary || !hidden.includes(c.key)) : columns;
}

// src/list/rowTone.ts
var TINT = 12;
var TINT_HOVER = 22;
var TINTED_ROW_CLASS = "bg-(--row-tint) hover:bg-(--row-tint-hover) shadow-[inset_3px_0_0_var(--row-accent)] [--muted-foreground:var(--muted-foreground-tinted)]";
function rowTone(color) {
  return {
    "--row-accent": color,
    "--row-tint": `color-mix(in oklab, ${color} ${TINT}%, transparent)`,
    "--row-tint-hover": `color-mix(in oklab, ${color} ${TINT_HOVER}%, transparent)`
  };
}
export {
  DEFAULT_ACTION_COLUMN_WIDTH,
  DEFAULT_LIST_PAGE_SIZE,
  EMPTY_LIST_PREFS,
  LIST_PAGE_SIZES,
  LIST_PREFS_STORAGE_PREFIX,
  TINTED_ROW_CLASS,
  cn,
  isListPageSize,
  listPrefsEqual,
  normalizeListPrefs,
  resolveColumnWidth,
  resolveListDefaults,
  rowTone,
  safeStorage,
  visibleColumnsOf
};

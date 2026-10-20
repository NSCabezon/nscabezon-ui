"use client";
import {
  Button,
  cn,
  safeStorage
} from "./chunk-6CXBNIIA.js";
import {
  useLabels,
  useUi
} from "./chunk-CH6JC77L.js";

// src/list/responsive-list.tsx
import * as React6 from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// src/list/columns-menu.tsx
import * as React2 from "react";
import { ChevronDown, ChevronUp, Columns3 } from "lucide-react";

// src/primitives/dropdown-menu.tsx
import "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
function DropdownMenu({ ...props }) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { "data-slot": "dropdown-menu-portal", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Trigger, { "data-slot": "dropdown-menu-trigger", ...props });
}
function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  collisionPadding = 8,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      align,
      collisionPadding,
      className: cn(
        "z-50 max-h-(--radix-dropdown-menu-content-available-height) max-w-(--radix-dropdown-menu-content-available-width) min-w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    DropdownMenuPrimitive.CheckboxItem,
    {
      "data-slot": "dropdown-menu-checkbox-item",
      "data-inset": inset,
      className: cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      checked,
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "pointer-events-none absolute right-2 flex items-center justify-center",
            "data-slot": "dropdown-menu-checkbox-item-indicator",
            children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, {}) })
          }
        ),
        children
      ]
    }
  );
}
function DropdownMenuRadioGroup({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.RadioGroup, { "data-slot": "dropdown-menu-radio-group", ...props });
}
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    DropdownMenuPrimitive.RadioItem,
    {
      "data-slot": "dropdown-menu-radio-item",
      "data-inset": inset,
      className: cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "pointer-events-none absolute right-2 flex items-center justify-center",
            "data-slot": "dropdown-menu-radio-item-indicator",
            children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, {}) })
          }
        ),
        children
      ]
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("-mx-1 my-1 h-px bg-border", className),
      ...props
    }
  );
}
function DropdownMenuSub({ ...props }) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Sub, { "data-slot": "dropdown-menu-sub", ...props });
}
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    DropdownMenuPrimitive.SubTrigger,
    {
      "data-slot": "dropdown-menu-sub-trigger",
      "data-inset": inset,
      className: cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(ChevronRightIcon, { className: "ml-auto" })
      ]
    }
  );
}
function DropdownMenuSubContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.SubContent,
    {
      "data-slot": "dropdown-menu-sub-content",
      className: cn(
        "z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      ),
      ...props
    }
  );
}

// src/prefs/listPrefs.ts
var LIST_PAGE_SIZES = [10, 25, 50, 100];
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
    pageSize: isListPageSize(defaults.pageSize) ? defaults.pageSize : DEFAULT_LIST_PAGE_SIZE,
    compact: typeof defaults.compact === "boolean" ? defaults.compact : false,
    order: cleanOrder(defaults.order, knownKeys)
  };
  if (!isRecord(raw)) return base;
  const hidden = Array.isArray(raw.hidden) ? Array.from(
    new Set(raw.hidden.filter((k) => typeof k === "string" && known.has(k)))
  ) : base.hidden;
  const widths = isRecord(raw.widths) ? cleanWidths(raw.widths, known) : base.widths;
  const sort = "sort" in raw ? cleanSort(raw.sort, known) ?? base.sort : base.sort;
  const pageSize = isListPageSize(raw.pageSize) ? raw.pageSize : base.pageSize;
  const compact = typeof raw.compact === "boolean" ? raw.compact : base.compact;
  const order = Array.isArray(raw.order) ? cleanOrder(raw.order, knownKeys) : base.order;
  return { hidden, widths, sort, pageSize, compact, order };
}
function cleanOrder(raw, knownKeys) {
  if (!Array.isArray(raw)) return [];
  const known = new Set(knownKeys);
  const kept = Array.from(
    new Set(raw.filter((k) => typeof k === "string" && known.has(k)))
  );
  if (kept.length === 0) return [];
  const seen = new Set(kept);
  return [...kept, ...knownKeys.filter((k) => !seen.has(k))];
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
  if (a.compact !== b.compact) return false;
  if (a.order.length !== b.order.length || a.order.some((k, i) => k !== b.order[i])) return false;
  if (a.sort === null || b.sort === null) return a.sort === b.sort;
  return a.sort.key === b.sort.key && a.sort.dir === b.sort.dir;
}
function resolveListDefaults(defaults = {}) {
  return {
    hidden: defaults.hidden ?? [],
    widths: defaults.widths ?? {},
    sort: defaults.sort ?? null,
    pageSize: defaults.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
    compact: defaults.compact ?? false,
    order: defaults.order ?? []
  };
}
var EMPTY_LIST_PREFS = Object.freeze({
  hidden: [],
  widths: {},
  sort: null,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
  compact: false,
  order: []
});

// src/list/columnOrder.ts
function orderColumns(columns, order) {
  if (!order?.length) return columns;
  const rank = /* @__PURE__ */ new Map();
  order.forEach((key, i) => {
    if (!rank.has(key)) rank.set(key, i);
  });
  const movable = columns.map((col, i) => ({ col, i })).filter(({ col }) => !col.action).sort(
    (a, b) => (rank.get(a.col.key) ?? Infinity) - (rank.get(b.col.key) ?? Infinity) || a.i - b.i
  ).map(({ col }) => col);
  let next = 0;
  return columns.map((col) => col.action ? col : movable[next++]);
}
function moveColumn(columns, order, from, to) {
  if (from === to) return null;
  const ordered = orderColumns(columns, order);
  const movable = ordered.filter((c) => !c.action).map((c) => c.key);
  const fromIdx = movable.indexOf(from);
  const toIdx = movable.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return null;
  movable.splice(fromIdx, 1);
  movable.splice(toIdx, 0, from);
  let next = 0;
  return ordered.map((c) => c.action ? c.key : movable[next++]);
}

// src/list/columns-menu.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function nodeText(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (React2.isValidElement(node)) {
    return nodeText(node.props.children);
  }
  return "";
}
function ColumnsMenu({
  columns,
  hidden,
  onHiddenChange,
  onReset,
  className,
  compact,
  onCompactChange,
  columnOrder,
  onColumnOrderChange,
  pageSize,
  onPageSizeChange,
  labels: labelsProp
}) {
  const labels = useLabels(labelsProp);
  const ordered = orderColumns(columns, columnOrder);
  const movable = ordered.filter((c) => !c.action).map((c) => c.key);
  function move(key, delta) {
    if (!onColumnOrderChange) return;
    const target = movable[movable.indexOf(key) + delta];
    if (target === void 0) return;
    const next = moveColumn(columns, columnOrder, key, target);
    if (next) onColumnOrderChange(next);
  }
  return /* @__PURE__ */ jsxs2(DropdownMenu, { children: [
    /* @__PURE__ */ jsx2(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx2(
      Button,
      {
        variant: "ghost",
        size: "icon",
        "aria-label": labels.columnsMenu,
        title: labels.columnsMenu,
        className,
        children: /* @__PURE__ */ jsx2(Columns3, {})
      }
    ) }),
    /* @__PURE__ */ jsxs2(DropdownMenuContent, { align: "end", className: onColumnOrderChange ? "w-64" : "w-56", children: [
      ordered.filter((col) => col.header).map((col) => {
        const visible = !!col.primary || !hidden.includes(col.key);
        const checkbox = /* @__PURE__ */ jsx2(
          DropdownMenuCheckboxItem,
          {
            className: onColumnOrderChange ? "min-w-0 flex-1" : void 0,
            checked: visible,
            disabled: col.primary,
            onSelect: (e) => e.preventDefault(),
            onCheckedChange: (checked) => {
              const rest = hidden.filter((k) => k !== col.key);
              onHiddenChange(checked ? rest : [...rest, col.key]);
            },
            children: col.header
          },
          col.key
        );
        if (!onColumnOrderChange) return checkbox;
        const name = nodeText(col.header) || col.key;
        const pos = movable.indexOf(col.key);
        const moveButton = (delta) => {
          const label = delta < 0 ? labels.columnMoveUp(name) : labels.columnMoveDown(name);
          const Icon = delta < 0 ? ChevronUp : ChevronDown;
          return /* @__PURE__ */ jsx2(
            DropdownMenuItem,
            {
              "aria-label": label,
              title: label,
              "data-column-move": delta < 0 ? "up" : "down",
              className: "size-7 shrink-0 justify-center p-0",
              disabled: delta < 0 ? pos <= 0 : pos >= movable.length - 1,
              onSelect: (e) => {
                e.preventDefault();
                move(col.key, delta);
              },
              children: /* @__PURE__ */ jsx2(Icon, { "aria-hidden": true })
            }
          );
        };
        return /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-0.5", "data-column-row": col.key, children: [
          checkbox,
          !col.action && pos >= 0 && /* @__PURE__ */ jsxs2(Fragment, { children: [
            moveButton(-1),
            moveButton(1)
          ] })
        ] }, col.key);
      }),
      onCompactChange && /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx2(DropdownMenuSeparator, {}),
        /* @__PURE__ */ jsx2(
          DropdownMenuCheckboxItem,
          {
            checked: !!compact,
            "data-compact-toggle": true,
            onSelect: (e) => e.preventDefault(),
            onCheckedChange: (checked) => onCompactChange(checked === true),
            children: labels.compactMode
          }
        )
      ] }),
      onPageSizeChange && /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx2(DropdownMenuSeparator, {}),
        /* @__PURE__ */ jsxs2(DropdownMenuSub, { children: [
          /* @__PURE__ */ jsx2(DropdownMenuSubTrigger, { "data-page-size-menu": true, children: labels.pageSizeMenu }),
          /* @__PURE__ */ jsx2(DropdownMenuPortal, { children: /* @__PURE__ */ jsx2(DropdownMenuSubContent, { collisionPadding: 8, children: /* @__PURE__ */ jsx2(
            DropdownMenuRadioGroup,
            {
              value: pageSize === void 0 ? void 0 : String(pageSize),
              onValueChange: (v) => onPageSizeChange(Number(v)),
              children: LIST_PAGE_SIZES.map((size) => /* @__PURE__ */ jsx2(
                DropdownMenuRadioItem,
                {
                  value: String(size),
                  className: "tabular-nums",
                  children: size
                },
                size
              ))
            }
          ) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx2(DropdownMenuSeparator, {}),
      /* @__PURE__ */ jsx2(DropdownMenuItem, { onSelect: () => onReset(), children: labels.columnsReset })
    ] })
  ] });
}

// src/list/listCompact.ts
import * as React3 from "react";
var ListCompactContext = React3.createContext(false);
var ListCompactProvider = ListCompactContext.Provider;
function useListCompact() {
  return React3.useContext(ListCompactContext);
}

// src/list/useColumnResize.tsx
import * as React4 from "react";

// src/list/columnWidth.ts
var DEFAULT_ACTION_COLUMN_WIDTH = 56;
var DEFAULT_COLUMN_WIDTH = 160;
var MIN_COLUMN_WIDTH = 64;
function isFillColumn(col) {
  return !!(col.fill ?? col.flex);
}
function resolveFillColumnKey(columns, widths) {
  const key = columns.find(isFillColumn)?.key;
  if (key == null || widths?.[key] != null) return void 0;
  return key;
}
function defaultWidthOf(col) {
  return col.width ?? (col.action && !col.header ? DEFAULT_ACTION_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH);
}
function columnFloor(col) {
  return col.minWidth ?? Math.min(MIN_COLUMN_WIDTH, defaultWidthOf(col));
}
function resolveColumnWidth(col, stored) {
  return Math.max(stored ?? defaultWidthOf(col), columnFloor(col));
}
function tableSizing(totalWidth, hasFill) {
  return hasFill ? { width: "100%", minWidth: totalWidth } : { width: totalWidth };
}
function visibleColumnsOf(columns, hidden) {
  return hidden?.length ? columns.filter((c) => c.primary || !hidden.includes(c.key)) : columns;
}

// src/list/useColumnResize.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var COLUMN_WIDTH_KEY_ATTR = "data-column-width-key";
var DRAG_THRESHOLD = 3;
function useColumnResize({
  columnWidths,
  onColumnWidthsChange,
  columns
}) {
  const [drag, setDrag] = React4.useState(null);
  const dragRef = React4.useRef(null);
  const restingFillKey = columns ? resolveFillColumnKey(columns, columnWidths) : void 0;
  const fillKey = drag?.key === restingFillKey ? void 0 : restingFillKey;
  const colOf = (key) => columns?.find((c) => c.key === key);
  function baseWidth(key) {
    const col = colOf(key);
    return col ? resolveColumnWidth(col, columnWidths?.[key]) : columnWidths?.[key];
  }
  function widthOf(key) {
    return drag?.key === key ? drag.width : columnWidths?.[key];
  }
  function liveWidth(key) {
    return drag?.key === key ? drag.width : baseWidth(key);
  }
  function colWidth(key) {
    if (key === fillKey) return void 0;
    return liveWidth(key);
  }
  const totalWidth = columns ? columns.reduce((sum, c) => sum + (liveWidth(c.key) ?? 0), 0) : void 0;
  function tableStyle(extra = 0) {
    return totalWidth == null ? void 0 : tableSizing(totalWidth + extra, !!fillKey);
  }
  function headOf(handle, columnKey, edge) {
    const own = handle.parentElement;
    const row = handle.closest("tr");
    if (row) {
      for (const el of Array.from(row.querySelectorAll(`[${COLUMN_WIDTH_KEY_ATTR}]`))) {
        if (el.getAttribute(COLUMN_WIDTH_KEY_ATTR) === columnKey) return el;
      }
    }
    return edge === "start" ? own?.previousElementSibling ?? null : own;
  }
  function clamp(d, clientX) {
    return Math.round(Math.max(d.min, d.startW + clientX - d.startX));
  }
  function resizeHandle(columnKey, edge = "end") {
    return /* @__PURE__ */ jsx3(
      "span",
      {
        role: "presentation",
        "data-column-resize-handle": edge === "start" ? "start" : "",
        className: edge === "start" ? "absolute inset-y-0 left-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:content-[''] hover:before:bg-muted-foreground" : "absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground",
        onPointerDown: (e) => {
          if (e.button !== 0) return;
          const th = headOf(e.currentTarget, columnKey, edge);
          const measured = () => th?.getBoundingClientRect().width || void 0;
          const col = colOf(columnKey);
          let startW;
          if (!col) startW = columnWidths?.[columnKey] ?? measured() ?? 0;
          else if (columnKey === restingFillKey) {
            startW = Math.max(measured() ?? 0, baseWidth(columnKey));
          } else startW = baseWidth(columnKey);
          const d = {
            key: columnKey,
            startX: e.clientX,
            startW,
            min: col ? columnFloor(col) : MIN_COLUMN_WIDTH,
            moved: false
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = d;
          e.preventDefault();
        },
        onPointerMove: (e) => {
          const d = dragRef.current;
          if (!d) return;
          if (!d.moved && Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return;
          d.moved = true;
          setDrag({ key: d.key, width: clamp(d, e.clientX) });
        },
        onPointerUp: (e) => {
          const d = dragRef.current;
          if (!d) return;
          dragRef.current = null;
          setDrag(null);
          const moved = d.moved || Math.abs(e.clientX - d.startX) >= DRAG_THRESHOLD;
          if (!moved) return;
          const px = clamp(d, e.clientX);
          if (columnWidths?.[d.key] === px) return;
          onColumnWidthsChange?.({ ...columnWidths, [d.key]: px });
        },
        onPointerCancel: () => {
          dragRef.current = null;
          setDrag(null);
        },
        onDoubleClick: () => {
          const next = { ...columnWidths };
          delete next[columnKey];
          onColumnWidthsChange?.(next);
        },
        onClick: (e) => e.stopPropagation()
      }
    );
  }
  return {
    widthOf,
    colWidth,
    fillKey,
    /** @deprecated v0.9.0: usa `fillKey`. */
    flexKey: fillKey,
    totalWidth,
    tableStyle,
    resizeHandle
  };
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

// src/primitives/table.tsx
import "react";
import { jsx as jsx4 } from "react/jsx-runtime";
function Table({
  className,
  containerClassName,
  ...props
}) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "table-container",
      className: cn("relative w-full", containerClassName ?? "overflow-x-auto"),
      children: /* @__PURE__ */ jsx4(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx4("thead", { "data-slot": "table-header", className: cn("[&_tr]:border-b", className), ...props });
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b transition-colors has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  );
}
var TABLE_CELL_X = "px-4";
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "h-10 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        TABLE_CELL_X,
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        TABLE_CELL_X,
        className
      ),
      ...props
    }
  );
}

// src/list/responsive-list.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var HEAD_INHERIT = "bg-inherit";
var HEAD_BG = "bg-[color:var(--list-head-bg,var(--list-auto-head-bg,var(--color-background)))]";
var AUTO_HEAD_BG = "[.bg-card_&]:[--list-auto-head-bg:var(--color-card)]";
var TOUCH_TEXT_LINK = "pointer-coarse:-my-3 pointer-coarse:min-h-11 pointer-coarse:py-3 pointer-coarse:-mx-3 pointer-coarse:min-w-11 pointer-coarse:px-3";
function ResponsiveList({
  columns,
  data,
  rowKey,
  rowHref,
  onRowClick,
  rowHoverProps,
  leading,
  isRowSelected,
  rowClassName,
  rowStyle,
  sort,
  onSortChange,
  resizable,
  columnWidths,
  onColumnWidthsChange,
  hiddenColumns,
  onHiddenColumnsChange,
  onColumnsReset,
  mobileColumnsMenu = true,
  compact = false,
  onCompactChange,
  columnOrder,
  onColumnOrderChange,
  pageSize,
  onPageSizeChange,
  stickyHeader,
  stickyHeaderTop,
  ready = true,
  className,
  labels: labelsProp
}) {
  const { Link, navigate } = useUi();
  const labels = useLabels(labelsProp);
  function rowNavProps(href) {
    if (!href) return {};
    return {
      onClick: (e) => {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(href, "_blank", "noopener");
        else navigate(href);
      },
      onAuxClick: (e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        window.open(href, "_blank", "noopener");
      }
    };
  }
  function renderCell(col, row, href) {
    if (!col.primary || col.noRowLink || !href) return col.cell(row);
    return /* @__PURE__ */ jsx5(Link, { href, className: "min-w-0 rounded-sm", onClick: (e) => e.stopPropagation(), children: col.cell(row) });
  }
  function renderCardTitle(col, row, href) {
    if (!href || col.noRowLink) {
      return /* @__PURE__ */ jsx5("div", { className: cn(col.noRowLink && href ? "min-w-0" : "truncate", "font-medium"), children: col.cell(row) });
    }
    return /* @__PURE__ */ jsx5(
      Link,
      {
        href,
        className: cn("block min-w-0 truncate rounded-sm font-medium", TOUCH_TEXT_LINK),
        onClick: (e) => e.stopPropagation(),
        children: col.cell(row)
      }
    );
  }
  function renderHead(col) {
    if (!col.sortable || !onSortChange) return col.header;
    const active = sort?.key === col.key;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return /* @__PURE__ */ jsxs3(
      "button",
      {
        type: "button",
        className: "-mx-4 inline-flex h-10 cursor-pointer items-center gap-1 rounded-sm px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick: () => onSortChange({ key: col.key, dir: active && sort.dir === "asc" ? "desc" : "asc" }),
        children: [
          col.header,
          /* @__PURE__ */ jsx5(
            Icon,
            {
              "aria-hidden": true,
              className: cn(
                "size-3.5 shrink-0",
                !active && "opacity-0 group-hover:opacity-60 group-focus-within:opacity-60"
              )
            }
          )
        ]
      }
    );
  }
  function ariaSort(col) {
    if (!col.sortable || !onSortChange) return void 0;
    if (sort?.key !== col.key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  }
  const orderedColumns = orderColumns(columns, columnOrder);
  const visibleColumns = visibleColumnsOf(orderedColumns, hiddenColumns);
  const { colWidth, tableStyle, resizeHandle } = useColumnResize({
    columnWidths,
    onColumnWidthsChange,
    columns: visibleColumns
  });
  const mobileColumns = visibleColumns.filter((c) => !c.hideOnMobile);
  const primary = mobileColumns.find((c) => c.primary);
  const actions = mobileColumns.filter((c) => c.action);
  const body = mobileColumns.filter((c) => !c.primary && !c.action);
  const stickyHeadClass = stickyHeader ? cn("sticky z-10 border-b", HEAD_BG) : void 0;
  const stickyHeadStyle = stickyHeader ? { top: (stickyHeaderTop ?? 0) - 1 } : void 0;
  const fixedCellClass = resizable ? "overflow-hidden text-ellipsis" : void 0;
  const lastVisibleKey = visibleColumns[visibleColumns.length - 1]?.key;
  const columnsMenu = onHiddenColumnsChange && onColumnsReset ? /* @__PURE__ */ jsx5(
    ColumnsMenu,
    {
      columns,
      hidden: hiddenColumns ?? [],
      onHiddenChange: onHiddenColumnsChange,
      onReset: onColumnsReset,
      compact,
      onCompactChange,
      columnOrder,
      onColumnOrderChange,
      pageSize,
      onPageSizeChange,
      labels: labelsProp
    }
  ) : null;
  const compactCellClass = compact ? "whitespace-nowrap overflow-hidden text-ellipsis" : void 0;
  const compactHeadClass = compact ? "whitespace-nowrap" : void 0;
  const menuInHead = !!columnsMenu;
  const menuOutsideScroll = menuInHead && !stickyHeader;
  const lastVisibleCol = visibleColumns[visibleColumns.length - 1];
  const lastHeadPad = menuInHead && !!lastVisibleCol && !(lastVisibleCol.action && !lastVisibleCol.header);
  const reorderable = !!onColumnOrderChange;
  const [dragKey, setDragKey] = React6.useState(null);
  const [overKey, setOverKey] = React6.useState(null);
  const resizingRef = React6.useRef(false);
  const visibleIndex = (key) => key == null ? -1 : visibleColumns.findIndex((c) => c.key === key);
  const dropSide = (key) => {
    if (!dragKey || overKey !== key || dragKey === key) return null;
    return visibleIndex(dragKey) < visibleIndex(key) ? "after" : "before";
  };
  function endDrag() {
    setDragKey(null);
    setOverKey(null);
  }
  function headDragProps(col) {
    if (!reorderable || col.action) return {};
    return {
      draggable: true,
      onPointerDown: (e) => {
        resizingRef.current = !!e.target.closest?.(
          "[data-column-resize-handle],[data-list-columns-menu-head]"
        );
      },
      onDragStart: (e) => {
        if (resizingRef.current) {
          resizingRef.current = false;
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", col.key);
        setDragKey(col.key);
      },
      onDragOver: (e) => {
        if (!dragKey) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overKey !== col.key) setOverKey(col.key);
      },
      onDragLeave: (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        if (overKey === col.key) setOverKey(null);
      },
      onDrop: (e) => {
        if (!dragKey) return;
        e.preventDefault();
        const next = moveColumn(columns, columnOrder, dragKey, col.key);
        endDrag();
        if (next) onColumnOrderChange?.(next);
      },
      onDragEnd: endDrag
    };
  }
  if (!ready) {
    return /* @__PURE__ */ jsxs3(
      "div",
      {
        className: cn("flex flex-col gap-2 py-1", className),
        "aria-busy": "true",
        "data-list-pending": "",
        children: [
          /* @__PURE__ */ jsx5("span", { className: "sr-only", children: labels.loading }),
          Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsx5("div", { "aria-hidden": "true", className: "h-9 animate-pulse rounded-md bg-muted" }, i))
        ]
      }
    );
  }
  return (
    // @container + @3xl (48rem, el mismo valor que `md`) en vez de `md:`: el
    // breakpoint miraba el VIEWPORT, pero el hueco real es el viewport menos el
    // sidebar (~300 px) menos el padding. A 1024 px de viewport la tabla solo
    // tenía 703 px, se pasaba de largo y lo que caía por el borde derecho era
    // siempre la columna de acciones, tras un scroll horizontal que nadie ve.
    // Midiendo el contenedor, una lista metida en una tarjeta estrecha también
    // acierta — el caso de las sedes en Ajustes → Taller, con 302 px.
    /* @__PURE__ */ jsx5(ListCompactProvider, { value: compact, children: /* @__PURE__ */ jsxs3("div", { className: cn("@container", AUTO_HEAD_BG, className), children: [
      /* @__PURE__ */ jsx5("div", { className: cn("hidden @3xl:block", menuOutsideScroll && "relative"), children: /* @__PURE__ */ jsxs3(
        Table,
        {
          containerClassName: stickyHeader ? "overflow-visible" : menuOutsideScroll ? "static overflow-x-auto" : void 0,
          "data-compact": compact ? "" : void 0,
          className: cn(
            stickyHeader && "border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0",
            resizable && "table-fixed"
          ),
          style: resizable ? tableStyle(leading ? 40 : 0) : void 0,
          children: [
            resizable && /* @__PURE__ */ jsxs3("colgroup", { children: [
              leading && /* @__PURE__ */ jsx5("col", { style: { width: 40 } }),
              visibleColumns.map((col) => {
                const width = colWidth(col.key);
                return /* @__PURE__ */ jsx5("col", { style: width ? { width } : void 0 }, col.key);
              })
            ] }),
            /* @__PURE__ */ jsx5(TableHeader, { className: cn(HEAD_INHERIT, stickyHeader && "[&_tr]:border-b-0"), children: /* @__PURE__ */ jsxs3(TableRow, { className: cn(HEAD_INHERIT, stickyHeader && "hover:bg-transparent"), children: [
              leading && /* @__PURE__ */ jsx5(TableHead, { className: cn("w-10", HEAD_INHERIT, stickyHeadClass), style: stickyHeadStyle, children: /* @__PURE__ */ jsx5("span", { className: "sr-only", children: labels.selectColumn }) }),
              visibleColumns.map((col, i) => {
                const draggable = reorderable && !col.action;
                const prevKey = i > 0 ? visibleColumns[i - 1].key : void 0;
                const side = draggable ? dropSide(col.key) : null;
                const isLast = col.key === lastVisibleKey;
                const staticHead = isLast && menuOutsideScroll;
                return /* @__PURE__ */ jsxs3(
                  TableHead,
                  {
                    className: cn(
                      // `relative` ANTES de `sticky` (stickyHeadClass): con las
                      // dos, tailwind-merge se queda con la última y sticky es
                      // también contenedor del asa absoluta (y del indicador).
                      (resizable || draggable) && !staticHead && "relative",
                      HEAD_INHERIT,
                      fixedCellClass,
                      col.sortable && onSortChange && "group",
                      draggable && "cursor-grab active:cursor-grabbing",
                      dragKey === col.key && "opacity-50",
                      stickyHeadClass,
                      col.headClassName,
                      compactHeadClass,
                      isLast && lastHeadPad && "pr-10",
                      staticHead && side && (side === "before" ? "shadow-[inset_2px_0_0_var(--color-primary)]" : "shadow-[inset_-2px_0_0_var(--color-primary)]")
                    ),
                    style: stickyHeadStyle,
                    "aria-sort": ariaSort(col),
                    "data-column-key": draggable ? col.key : void 0,
                    "data-column-width-key": resizable ? col.key : void 0,
                    "data-dragging": dragKey === col.key ? "" : void 0,
                    "data-drop": side ?? void 0,
                    ...headDragProps(col),
                    children: [
                      renderHead(col),
                      side && !staticHead && /* @__PURE__ */ jsx5(
                        "span",
                        {
                          "aria-hidden": true,
                          "data-column-drop-indicator": side,
                          className: cn(
                            "pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-primary",
                            side === "before" ? "left-0" : "right-0"
                          )
                        }
                      ),
                      col.action && !col.header && /* @__PURE__ */ jsx5("span", { className: "sr-only", children: labels.actionsColumn }),
                      resizable && !isLast && resizeHandle(col.key),
                      isLast && columnsMenu && /* @__PURE__ */ jsx5(
                        "div",
                        {
                          "data-list-columns-menu-head": true,
                          className: cn(
                            "absolute top-0 right-0 z-20 flex h-10 cursor-auto items-center px-1",
                            HEAD_INHERIT
                          ),
                          onDragOver: (e) => e.stopPropagation(),
                          onDrop: (e) => e.stopPropagation(),
                          children: columnsMenu
                        }
                      ),
                      resizable && prevKey && !staticHead && resizeHandle(prevKey, "start"),
                      resizable && prevKey && staticHead && /* @__PURE__ */ jsx5(
                        "div",
                        {
                          "data-column-resize-anchor": "",
                          className: "relative -my-20 -ml-4 h-40 w-0",
                          children: resizeHandle(prevKey, "start")
                        }
                      )
                    ]
                  },
                  col.key
                );
              })
            ] }) }),
            /* @__PURE__ */ jsx5(TableBody, { children: data.map((row) => {
              const href = rowHref?.(row);
              const style = rowStyle?.(row);
              return /* @__PURE__ */ jsxs3(
                TableRow,
                {
                  className: cn(
                    (href || onRowClick) && (style ? "cursor-pointer" : "cursor-pointer hover:bg-muted/50"),
                    style && TINTED_ROW_CLASS,
                    rowClassName?.(row)
                  ),
                  style,
                  "data-state": isRowSelected?.(row) ? "selected" : void 0,
                  ...rowHoverProps?.(row),
                  ...href ? rowNavProps(href) : { onClick: onRowClick ? () => onRowClick(row) : void 0 },
                  role: !href && onRowClick ? "button" : void 0,
                  tabIndex: !href && onRowClick ? 0 : void 0,
                  onKeyDown: !href && onRowClick ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  } : void 0,
                  children: [
                    leading && // onAuxClick además de onClick: sin él, el click de rueda
                    // sobre el checkbox de selección abría el detalle en una
                    // pestaña nueva.
                    /* @__PURE__ */ jsx5(
                      TableCell,
                      {
                        onClick: (e) => e.stopPropagation(),
                        onAuxClick: (e) => e.stopPropagation(),
                        children: leading(row)
                      }
                    ),
                    visibleColumns.map((col) => /* @__PURE__ */ jsx5(
                      TableCell,
                      {
                        className: cn(
                          // Las `action` quedan fuera del recorte con elipsis: son
                          // botones (con o sin texto), no texto que deba acortarse.
                          // Sin esto un botón «Presupuesto de venta» dentro de una
                          // columna estrecha se recortaba a media palabra.
                          fixedCellClass && !col.action && fixedCellClass,
                          col.cellClassName,
                          !col.action && compactCellClass
                        ),
                        children: renderCell(col, row, href)
                      },
                      col.key
                    ))
                  ]
                },
                rowKey(row)
              );
            }) })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs3("div", { className: "space-y-2 @3xl:hidden", children: [
        mobileColumnsMenu && columnsMenu && /* @__PURE__ */ jsx5("div", { className: "flex justify-end", "data-list-columns-menu": true, children: columnsMenu }),
        data.map((row) => {
          const href = rowHref?.(row);
          const style = rowStyle?.(row);
          return /* @__PURE__ */ jsxs3(
            "div",
            {
              className: cn(
                // `bg-card` en su posición de siempre: sin `rowStyle` la cadena
                // de clases queda idéntica a la de antes de existir esta prop.
                "rounded-xl",
                style ? TINTED_ROW_CLASS : "bg-card",
                "p-4 text-sm ring-1 ring-foreground/10",
                (href || onRowClick) && "cursor-pointer active:bg-muted/50",
                isRowSelected?.(row) && "ring-primary",
                rowClassName?.(row)
              ),
              style,
              "data-compact": compact ? "" : void 0,
              ...rowHoverProps?.(row),
              ...href ? rowNavProps(href) : { onClick: onRowClick ? () => onRowClick(row) : void 0 },
              role: !href && onRowClick ? "button" : void 0,
              tabIndex: !href && onRowClick ? 0 : void 0,
              onKeyDown: !href && onRowClick ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row);
                }
              } : void 0,
              children: [
                /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [
                  /* @__PURE__ */ jsxs3("div", { className: "flex min-w-32 flex-1 items-center gap-2", "data-list-card-title": true, children: [
                    leading && /* @__PURE__ */ jsx5(
                      "span",
                      {
                        onClick: (e) => e.stopPropagation(),
                        onAuxClick: (e) => e.stopPropagation(),
                        children: leading(row)
                      }
                    ),
                    primary && renderCardTitle(primary, row, href)
                  ] }),
                  actions.length > 0 && // `shrink-0` se queda: dentro de SU línea las acciones no se
                  // encogen (un botón a medio recortar no sirve). Lo que evita
                  // el aplastamiento es el salto de línea de arriba. `flex-wrap`
                  // por si en su propia línea siguen sin caber (3 botones con
                  // texto a 390px): envuelven en dos filas en vez de salirse, y
                  // `max-w-full` acota el bloque al ancho de la card para que
                  // ese `shrink-0` no lo deje asomar por el borde.
                  // Compacto: en una sola fila; lo que no quepa se recorta.
                  /* @__PURE__ */ jsx5(
                    "div",
                    {
                      className: cn(
                        "flex max-w-full shrink-0 items-center gap-1",
                        compact ? "flex-nowrap overflow-hidden" : "flex-wrap"
                      ),
                      children: actions.map((col) => /* @__PURE__ */ jsx5("span", { children: col.cell(row) }, col.key))
                    }
                  )
                ] }),
                body.length > 0 && /* @__PURE__ */ jsx5("dl", { className: "mt-2 space-y-1", children: body.filter((col) => !col.mobileHideWhen?.(row)).map((col) => /* @__PURE__ */ jsxs3(
                  "div",
                  {
                    className: cn(
                      col.mobileFullWidth ? "space-y-1" : "flex justify-between gap-3"
                    ),
                    children: [
                      !col.mobileHideLabel && col.header && /* @__PURE__ */ jsx5(
                        "dt",
                        {
                          className: cn(
                            "text-muted-foreground",
                            col.mobileFullWidth ? "text-xs font-medium uppercase tracking-wide" : "shrink-0"
                          ),
                          children: col.header
                        }
                      ),
                      /* @__PURE__ */ jsx5(
                        "dd",
                        {
                          className: cn(
                            "min-w-0",
                            compact ? "truncate" : "break-words",
                            col.mobileFullWidth ? "text-left" : "text-right"
                          ),
                          children: col.cell(row)
                        }
                      )
                    ]
                  },
                  col.key
                )) })
              ]
            },
            rowKey(row)
          );
        })
      ] })
    ] }) })
  );
}

// src/list/pagination.tsx
import { useEffect } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function stableCountMinWidth(text, digitSlots) {
  return `${text.replace(/\d/g, "").length + digitSlots}ch`;
}
function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  truncated,
  className,
  labels: labelsProp
}) {
  const labels = useLabels(labelsProp);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const outOfRange = page > maxPage;
  useEffect(() => {
    if (outOfRange) onPageChange(maxPage);
  }, [outOfRange, maxPage, onPageChange]);
  if (total <= pageSize) return null;
  const lastPage = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return /* @__PURE__ */ jsxs4("div", { className: cn("flex items-center justify-center gap-1 pt-2", className), children: [
    /* @__PURE__ */ jsx6(
      Button,
      {
        variant: "outline",
        size: "icon-sm",
        disabled: page <= 1,
        onClick: () => onPageChange(1),
        "aria-label": labels.paginationFirst,
        title: labels.paginationFirst,
        children: /* @__PURE__ */ jsx6(ChevronsLeft, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsx6(
      Button,
      {
        variant: "outline",
        size: "icon-sm",
        disabled: page <= 1,
        onClick: () => onPageChange(page - 1),
        "aria-label": labels.paginationPrev,
        title: labels.paginationPrev,
        children: /* @__PURE__ */ jsx6(ChevronLeft, { className: "size-4" })
      }
    ),
    (() => {
      const text = truncated ? labels.paginationRangeTruncated(from, to, total) : labels.paginationRange(from, to, total);
      return /* @__PURE__ */ jsx6(
        "span",
        {
          className: "inline-block px-2 text-center text-sm text-muted-foreground tabular-nums",
          style: { minWidth: stableCountMinWidth(text, 12) },
          children: text
        }
      );
    })(),
    /* @__PURE__ */ jsx6(
      Button,
      {
        variant: "outline",
        size: "icon-sm",
        disabled: page >= lastPage,
        onClick: () => onPageChange(page + 1),
        "aria-label": labels.paginationNext,
        title: labels.paginationNext,
        children: /* @__PURE__ */ jsx6(ChevronRight, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsx6(
      Button,
      {
        variant: "outline",
        size: "icon-sm",
        disabled: page >= lastPage,
        onClick: () => onPageChange(lastPage),
        "aria-label": labels.paginationLast,
        title: labels.paginationLast,
        children: /* @__PURE__ */ jsx6(ChevronsRight, { className: "size-4" })
      }
    )
  ] });
}

// src/list/usePagination.ts
import { useState as useState3 } from "react";
var DEFAULT_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
function usePagination(deps = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState3(1);
  const key = JSON.stringify([deps, pageSize]);
  const [prevKey, setPrevKey] = useState3(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setPage(1);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, setPage, pageSize, from, to };
}

// src/list/ListFooter.tsx
import { Loader2 } from "lucide-react";

// src/primitives/select.tsx
import "react";
import { Select as SelectPrimitive } from "radix-ui";
import { ChevronDownIcon, CheckIcon as CheckIcon2, ChevronUpIcon } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function Select({ ...props }) {
  return /* @__PURE__ */ jsx7(SelectPrimitive.Root, { "data-slot": "select", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs5(
    SelectPrimitive.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx7(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx7(ChevronDownIcon, { className: "pointer-events-none size-4 text-muted-foreground" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}) {
  return /* @__PURE__ */ jsx7(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs5(
    SelectPrimitive.Content,
    {
      "data-slot": "select-content",
      "data-align-trigger": position === "item-aligned",
      className: cn(
        "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      align,
      ...props,
      children: [
        /* @__PURE__ */ jsx7(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx7(
          SelectPrimitive.Viewport,
          {
            "data-position": position,
            className: cn(
              "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
              position === "popper" && ""
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx7(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs5(
    SelectPrimitive.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx7("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center", children: /* @__PURE__ */ jsx7(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx7(CheckIcon2, { className: "pointer-events-none" }) }) }),
        /* @__PURE__ */ jsx7(SelectPrimitive.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    SelectPrimitive.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx7(ChevronUpIcon, {})
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    SelectPrimitive.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx7(ChevronDownIcon, {})
    }
  );
}

// src/list/ListFooter.tsx
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function ListFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  hidden,
  onHiddenChange,
  onReset,
  compact,
  onCompactChange,
  columnOrder,
  onColumnOrderChange,
  columns,
  truncated,
  loading,
  className,
  labels: labelsProp
}) {
  const labels = useLabels(labelsProp);
  const label = labels.pageSizeLabel;
  const showCountOnly = total > 0 && total <= pageSize;
  const isEmpty = total === 0;
  const hasColumnsMenu = !!onHiddenChange && !!onReset;
  const status = isEmpty ? labels.noResults : truncated ? labels.countTruncated(total) : labels.count(total);
  return (
    // El `@container` va aquí y el layout en el hijo: un elemento no puede
    // consultarse a sí mismo.
    /* @__PURE__ */ jsx8("div", { className: cn("@container", className), children: /* @__PURE__ */ jsxs6(
      "div",
      {
        className: cn(
          // v0.7.0: pie más bajo (pt-2 → pt-1, separación vertical al
          // envolver gap-y-1). En táctil los botones siguen midiendo 44 px.
          "flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1",
          "@2xl:grid @2xl:grid-cols-[1fr_auto_1fr]"
        ),
        children: [
          /* @__PURE__ */ jsx8("span", { className: "hidden @2xl:block", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx8("span", { role: "status", className: "sr-only", children: status }),
          /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-center gap-2", children: [
            showCountOnly && /* @__PURE__ */ jsx8(
              "span",
              {
                "data-list-count": "",
                className: "my-[2pt] inline-block text-center text-sm text-muted-foreground tabular-nums",
                style: { minWidth: stableCountMinWidth(status, 6) },
                children: status
              }
            ),
            /* @__PURE__ */ jsx8(
              Pagination,
              {
                page,
                pageSize,
                total,
                onPageChange,
                truncated,
                className: "pt-0",
                labels: labelsProp
              }
            ),
            /* @__PURE__ */ jsx8(
              "span",
              {
                "aria-live": "polite",
                className: "inline-flex size-4 shrink-0 items-center justify-center",
                children: loading && /* @__PURE__ */ jsxs6(Fragment2, { children: [
                  /* @__PURE__ */ jsx8(Loader2, { className: "size-4 animate-spin text-muted-foreground" }),
                  /* @__PURE__ */ jsx8("span", { className: "sr-only", children: labels.loading })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "ml-auto flex items-center gap-2 @2xl:ml-0 @2xl:justify-self-end", children: [
            hasColumnsMenu && /* @__PURE__ */ jsx8(
              ColumnsMenu,
              {
                className: cn("size-7", !isEmpty && "@3xl:hidden"),
                columns: columns ?? [],
                hidden: hidden ?? [],
                onHiddenChange,
                onReset,
                compact,
                onCompactChange,
                columnOrder,
                onColumnOrderChange,
                pageSize,
                onPageSizeChange: isEmpty ? void 0 : onPageSizeChange,
                labels: labelsProp
              }
            ),
            !isEmpty && !hasColumnsMenu && /* @__PURE__ */ jsxs6(Select, { value: String(pageSize), onValueChange: (v) => onPageSizeChange(Number(v)), children: [
              /* @__PURE__ */ jsxs6(
                SelectTrigger,
                {
                  "aria-label": label,
                  title: label,
                  className: "tabular-nums pointer-coarse:min-h-11 pointer-coarse:min-w-11",
                  children: [
                    /* @__PURE__ */ jsx8("span", { className: "@md:hidden", children: pageSize }),
                    /* @__PURE__ */ jsx8("span", { className: "hidden @md:inline", children: labels.pageSizeValue(pageSize) })
                  ]
                }
              ),
              /* @__PURE__ */ jsx8(SelectContent, { align: "end", position: "popper", children: LIST_PAGE_SIZES.map((size) => /* @__PURE__ */ jsx8(SelectItem, { value: String(size), className: "tabular-nums", children: labels.pageSizeValue(size) }, size)) })
            ] })
          ] })
        ]
      }
    ) })
  );
}

// src/list/useListView.ts
import { useMemo as useMemo2 } from "react";

// src/prefs/useListPrefs.ts
import { useCallback, useEffect as useEffect2, useMemo, useRef as useRef3, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// src/prefs/stores.ts
var localOnlyListPrefsStore = Object.freeze({
  userId: null,
  load: async () => null,
  save: async () => {
  }
});
function createSupabaseListPrefsStore(client, userId, { table = "user_list_prefs", onError = defaultOnError } = {}) {
  const uid = userId ?? null;
  return {
    userId: uid,
    async load(listKey) {
      if (!uid) return null;
      const { data, error } = await client.from(table).select("prefs").eq("user_id", uid).eq("list_key", listKey).maybeSingle();
      if (error) throw error;
      return data?.prefs ?? null;
    },
    async save(listKey, prefs) {
      if (!uid) return;
      try {
        const { error } = await client.from(table).upsert({ user_id: uid, list_key: listKey, prefs });
        if (error) onError(error);
      } catch (error) {
        onError(error);
      }
    }
  };
}
function defaultOnError(error) {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return;
  console.warn("user_list_prefs upsert failed", error);
}

// src/prefs/useListPrefs.ts
var LIST_PREFS_WIDTHS_DEBOUNCE_MS = 400;
var memory = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Map();
var memoryUser;
function listPrefsStorageKey(userId, listKey) {
  if (userId === void 0) return null;
  if (userId === null) return `${LIST_PREFS_STORAGE_PREFIX}${listKey}`;
  return `${LIST_PREFS_STORAGE_PREFIX}${userId}:${listKey}`;
}
function noteUser(userId) {
  if (typeof userId !== "string" || userId === memoryUser) return;
  if (typeof memoryUser === "string") memory.clear();
  memoryUser = userId;
}
function readSnapshot(key) {
  if (key == null) return null;
  if (!memory.has(key)) memory.set(key, safeStorage.getItem(key));
  return memory.get(key) ?? null;
}
function notify(key) {
  listeners.get(key)?.forEach((cb) => cb());
}
function writeLocal(key, prefs) {
  if (key == null) return;
  const raw = JSON.stringify(prefs);
  if (memory.get(key) === raw) return;
  memory.set(key, raw);
  safeStorage.setItem(key, raw);
  notify(key);
}
function dropLegacy(listKey) {
  const legacy = listPrefsStorageKey(null, listKey);
  if (safeStorage.getItem(legacy) == null && !memory.get(legacy)) return;
  safeStorage.removeItem(legacy);
  memory.delete(legacy);
  notify(legacy);
}
function subscribe(key, cb) {
  if (key == null) return () => {
  };
  let set = listeners.get(key);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  const onStorage = (e) => {
    if (e.key !== key) return;
    memory.set(key, e.newValue);
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
function parse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function useListPrefs(listKey, { columnKeys, defaults, store: storeProp }) {
  const ui = useUi();
  const store = storeProp ?? ui.listPrefsStore ?? localOnlyListPrefsStore;
  const userId = store.userId;
  noteUser(userId);
  const key = listPrefsStorageKey(userId, listKey);
  const storeRef = useRef3(store);
  useEffect2(() => {
    storeRef.current = store;
  });
  const queryClient = useQueryClient();
  const knownKey = columnKeys.join("|");
  const defaultsJson = JSON.stringify(resolveListDefaults(defaults));
  const normalize = useCallback(
    (raw) => normalizeListPrefs(
      raw,
      knownKey ? knownKey.split("|") : [],
      JSON.parse(defaultsJson)
    ),
    [knownKey, defaultsJson]
  );
  const snapshot = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => readSnapshot(key),
    () => null
  );
  const prefs = useMemo(() => normalize(parse(snapshot)), [normalize, snapshot]);
  const current = useCallback(() => normalize(parse(readSnapshot(key))), [normalize, key]);
  const queryKey = useMemo(() => ["list-prefs", userId, listKey], [userId, listKey]);
  const query = useQuery({
    queryKey,
    enabled: !!userId,
    // Se reconcilia una vez al montar la lista; un refetch en segundo plano
    // (foco de ventana) podría traer una fila anterior a un debounce en vuelo
    // y pisar lo que el usuario acaba de arrastrar.
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await storeRef.current.load(listKey);
      return raw == null ? null : { prefs: raw };
    }
  });
  const reconciledRef = useRef3(null);
  useEffect2(() => {
    if (!userId || !query.isSuccess) return;
    const tag = `${userId}:${listKey}`;
    if (reconciledRef.current === tag) return;
    reconciledRef.current = tag;
    const local = current();
    if (query.data) {
      const next = normalize(query.data.prefs);
      if (!listPrefsEqual(next, local)) writeLocal(key, next);
    } else if (!listPrefsEqual(local, normalize(null))) {
      void storeRef.current.save(listKey, local);
    }
    dropLegacy(listKey);
  }, [userId, listKey, key, query.isSuccess, query.data, normalize, current]);
  const timerRef = useRef3(null);
  const pendingRef = useRef3(null);
  const commit = useCallback(
    (next) => {
      pendingRef.current = null;
      if (!userId) return;
      queryClient.setQueryData(["list-prefs", userId, listKey], { prefs: next });
      void storeRef.current.save(listKey, next);
    },
    [userId, listKey, queryClient]
  );
  const persist = useCallback(
    (next, { debounce }) => {
      writeLocal(key, next);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!debounce) {
        commit(next);
        return;
      }
      pendingRef.current = next;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (pendingRef.current) commit(pendingRef.current);
      }, LIST_PREFS_WIDTHS_DEBOUNCE_MS);
    },
    [key, commit]
  );
  useEffect2(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (pendingRef.current) commit(pendingRef.current);
    },
    [commit]
  );
  const setHidden = useCallback(
    (hidden) => persist({ ...current(), hidden }, { debounce: false }),
    [persist, current]
  );
  const setWidths = useCallback(
    (widths) => persist({ ...current(), widths }, { debounce: true }),
    [persist, current]
  );
  const setSort = useCallback(
    (sort) => persist({ ...current(), sort }, { debounce: false }),
    [persist, current]
  );
  const setPageSize = useCallback(
    (pageSize) => persist({ ...current(), pageSize }, { debounce: false }),
    [persist, current]
  );
  const setCompact = useCallback(
    (compact) => persist({ ...current(), compact }, { debounce: false }),
    [persist, current]
  );
  const setOrder = useCallback(
    (order) => persist({ ...current(), order }, { debounce: false }),
    [persist, current]
  );
  const reset = useCallback(() => {
    const base = normalize(null);
    persist(
      { ...current(), hidden: base.hidden, widths: base.widths, order: base.order },
      { debounce: false }
    );
  }, [persist, current, normalize]);
  return {
    prefs,
    setHidden,
    setWidths,
    setSort,
    setPageSize,
    setCompact,
    setOrder,
    reset,
    isLoaded: userId === null || userId !== void 0 && (snapshot != null || query.isSuccess || query.isError)
  };
}

// src/list/useListView.ts
function useListView(listKey, {
  columnKeys,
  defaults,
  deps = [],
  paginated = true,
  stickyHeader = true,
  store,
  compactable = false
}) {
  const listPrefs = useListPrefs(listKey, { columnKeys, defaults, store });
  const { prefs, setSort, setWidths, setHidden, setPageSize, setCompact, setOrder, reset } = listPrefs;
  const { sort, hidden, widths, pageSize, order } = prefs;
  const compact = compactable && prefs.compact;
  const ready = listPrefs.isLoaded;
  const { page, setPage, from, to } = usePagination([...deps, sort], pageSize);
  const listProps = useMemo2(
    () => ({
      sort,
      onSortChange: setSort,
      resizable: true,
      columnWidths: widths,
      onColumnWidthsChange: setWidths,
      hiddenColumns: hidden,
      onHiddenColumnsChange: setHidden,
      onColumnsReset: reset,
      mobileColumnsMenu: !paginated,
      stickyHeader,
      columnOrder: order,
      onColumnOrderChange: setOrder,
      ...compactable ? { compact, onCompactChange: setCompact } : {},
      ...paginated ? { pageSize, onPageSizeChange: setPageSize } : {},
      ready
    }),
    [
      ready,
      order,
      setOrder,
      pageSize,
      setPageSize,
      sort,
      setSort,
      widths,
      setWidths,
      hidden,
      setHidden,
      reset,
      paginated,
      stickyHeader,
      compactable,
      compact,
      setCompact
    ]
  );
  const footerProps = useMemo2(
    () => ({
      page,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
      hidden,
      onHiddenChange: setHidden,
      onReset: reset,
      columnOrder: order,
      onColumnOrderChange: setOrder,
      ...compactable ? { compact, onCompactChange: setCompact } : {}
    }),
    [
      page,
      pageSize,
      setPage,
      setPageSize,
      hidden,
      setHidden,
      reset,
      order,
      setOrder,
      compactable,
      compact,
      setCompact
    ]
  );
  const base = {
    prefs,
    sort,
    listProps,
    ready,
    isLoaded: ready,
    compact,
    order
  };
  if (!paginated) return base;
  return { ...base, pageSize, page, setPage, from, to, footerProps };
}

// src/list/useListColumns.ts
function useListColumns(listKey, columnKeys, { store } = {}) {
  const { prefs, setHidden, setWidths, setOrder, reset } = useListPrefs(listKey, {
    columnKeys,
    store
  });
  return {
    resizable: true,
    columnWidths: prefs.widths,
    onColumnWidthsChange: setWidths,
    hiddenColumns: prefs.hidden,
    onHiddenColumnsChange: setHidden,
    onColumnsReset: reset,
    columnOrder: prefs.order,
    onColumnOrderChange: setOrder
  };
}

// src/prefs/useSupabaseListPrefsStore.ts
import { useEffect as useEffect3, useMemo as useMemo3, useRef as useRef4, useState as useState4 } from "react";
function useSupabaseListPrefsStore(client, { table, onError } = {}) {
  const [userId, setUserId] = useState4(void 0);
  useEffect3(() => {
    let active = true;
    let heardFromListener = false;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      heardFromListener = true;
      setUserId(session?.user.id ?? null);
    });
    client.auth.getSession().then(({ data: { session } }) => {
      if (active && !heardFromListener) setUserId(session?.user.id ?? null);
    }).catch(() => {
      if (active && !heardFromListener) setUserId(null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);
  const onErrorRef = useRef4(onError);
  useEffect3(() => {
    onErrorRef.current = onError;
  });
  return useMemo3(() => {
    const store = createSupabaseListPrefsStore(client, userId, {
      table,
      onError: (error) => {
        const handler = onErrorRef.current;
        if (handler) handler(error);
        else defaultOnError(error);
      }
    });
    return userId === void 0 ? { ...store, userId: void 0 } : store;
  }, [client, userId, table]);
}

export {
  LIST_PAGE_SIZES,
  DEFAULT_LIST_PAGE_SIZE,
  isListPageSize,
  LIST_PREFS_STORAGE_PREFIX,
  normalizeListPrefs,
  listPrefsEqual,
  resolveListDefaults,
  EMPTY_LIST_PREFS,
  orderColumns,
  moveColumn,
  ColumnsMenu,
  useListCompact,
  DEFAULT_ACTION_COLUMN_WIDTH,
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  isFillColumn,
  resolveFillColumnKey,
  columnFloor,
  resolveColumnWidth,
  tableSizing,
  visibleColumnsOf,
  COLUMN_WIDTH_KEY_ATTR,
  useColumnResize,
  TINTED_ROW_CLASS,
  rowTone,
  TOUCH_TEXT_LINK,
  ResponsiveList,
  Pagination,
  DEFAULT_PAGE_SIZE,
  usePagination,
  ListFooter,
  localOnlyListPrefsStore,
  createSupabaseListPrefsStore,
  LIST_PREFS_WIDTHS_DEBOUNCE_MS,
  listPrefsStorageKey,
  useListPrefs,
  useListView,
  useListColumns,
  useSupabaseListPrefsStore
};

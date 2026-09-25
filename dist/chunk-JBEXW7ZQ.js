"use client";
import {
  useLabels,
  useUi
} from "./chunk-77F46GKN.js";

// src/list/responsive-list.tsx
import "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// src/lib/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/list/columns-menu.tsx
import "react";
import { Columns3 } from "lucide-react";

// src/primitives/button.tsx
import "react";
import { Slot } from "radix-ui";

// src/primitives/button-variants.ts
import { cva } from "class-variance-authority";
var TOUCH_TARGET = "pointer-coarse:min-h-11 pointer-coarse:min-w-11";
var buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // A11Y-3 (23/09): el texto va en --destructive-strong, no en --destructive:
        // sobre su propio tinte rojo este se quedaba en 3,8–4,3:1. Lo vigila
        // destructive-contrast.test.ts.
        destructive: "bg-destructive/10 text-destructive-strong hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline"
      },
      // Área de toque en táctil (M22, auditoría 2026-09-18): los tamaños
      // compactos (`xs`, `sm`, `icon`, `icon-xs`, `icon-sm`) miden 24-32 px y
      // se usan en ~30 columnas `action` de listados, por debajo del 44×44 que
      // docs/ui-patterns.md adopta (WCAG 2.5.5). En vez de tocar cada fichero,
      // `pointer-coarse:` (`@media (pointer: coarse)`, Tailwind 4.1+) pone un
      // suelo de 44 px SOLO donde se pulsa con el dedo: con ratón siguen
      // compactos. `min-*` gana a `h-*`/`size-*` sin importar el orden. Quien
      // de verdad no pueda crecer sobreescribe con `pointer-coarse:min-h-0`.
      // TODOS los tamaños llevan el suelo (5 de docs/mobile-view-2026-09-20.md):
      // `default` (32 px), `lg` e `icon-lg` (36 px) tampoco llegaban a 44 y son
      // los ~500 botones por pantalla de barras de acción, paginación y
      // segmentados; en táctil crecen 8-12 px, que es lo que exige la regla.
      size: {
        default: `h-8 gap-1.5 px-2.5 ${TOUCH_TARGET} has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        xs: `h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs ${TOUCH_TARGET} in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3`,
        sm: `h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] ${TOUCH_TARGET} in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5`,
        lg: `h-9 gap-1.5 px-2.5 ${TOUCH_TARGET} has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`,
        icon: `size-8 ${TOUCH_TARGET}`,
        "icon-xs": `size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3 ${TOUCH_TARGET}`,
        "icon-sm": `size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg ${TOUCH_TARGET}`,
        "icon-lg": `size-9 ${TOUCH_TARGET}`
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

// src/primitives/button.tsx
import { jsx } from "react/jsx-runtime";
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}

// src/primitives/dropdown-menu.tsx
import "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function DropdownMenu({ ...props }) {
  return /* @__PURE__ */ jsx2(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx2(DropdownMenuPrimitive.Trigger, { "data-slot": "dropdown-menu-trigger", ...props });
}
function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  collisionPadding = 8,
  ...props
}) {
  return /* @__PURE__ */ jsx2(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx2(
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
  return /* @__PURE__ */ jsx2(
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
        /* @__PURE__ */ jsx2(
          "span",
          {
            className: "pointer-events-none absolute right-2 flex items-center justify-center",
            "data-slot": "dropdown-menu-checkbox-item-indicator",
            children: /* @__PURE__ */ jsx2(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx2(CheckIcon, {}) })
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
  return /* @__PURE__ */ jsx2(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("-mx-1 my-1 h-px bg-border", className),
      ...props
    }
  );
}

// src/list/columns-menu.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function ColumnsMenu({
  columns,
  hidden,
  onHiddenChange,
  onReset,
  className,
  labels: labelsProp
}) {
  const labels = useLabels(labelsProp);
  return /* @__PURE__ */ jsxs2(DropdownMenu, { children: [
    /* @__PURE__ */ jsx3(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx3(
      Button,
      {
        variant: "ghost",
        size: "icon",
        "aria-label": labels.columnsMenu,
        title: labels.columnsMenu,
        className,
        children: /* @__PURE__ */ jsx3(Columns3, {})
      }
    ) }),
    /* @__PURE__ */ jsxs2(DropdownMenuContent, { align: "end", className: "w-56", children: [
      columns.filter((col) => col.header).map((col) => {
        const visible = !!col.primary || !hidden.includes(col.key);
        return /* @__PURE__ */ jsx3(
          DropdownMenuCheckboxItem,
          {
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
      }),
      /* @__PURE__ */ jsx3(DropdownMenuSeparator, {}),
      /* @__PURE__ */ jsx3(DropdownMenuItem, { onSelect: () => onReset(), children: labels.columnsReset })
    ] })
  ] });
}

// src/list/useColumnResize.tsx
import * as React4 from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var MIN_COLUMN_WIDTH = 64;
function useColumnResize({
  columnWidths,
  onColumnWidthsChange
}) {
  const [drag, setDrag] = React4.useState(null);
  const dragRef = React4.useRef(null);
  function widthOf(key) {
    return drag?.key === key ? drag.px : columnWidths?.[key];
  }
  function resizeHandle(columnKey) {
    return /* @__PURE__ */ jsx4(
      "span",
      {
        role: "presentation",
        className: "absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none before:absolute before:inset-y-1.5 before:right-0 before:w-px before:bg-border before:content-[''] hover:before:inset-y-0 hover:before:w-0.5 hover:before:bg-muted-foreground",
        onPointerDown: (e) => {
          if (e.button !== 0) return;
          const th = e.currentTarget.parentElement;
          const startW = columnWidths?.[columnKey] ?? th?.getBoundingClientRect().width ?? 0;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { key: columnKey, startX: e.clientX, startW };
          setDrag({ key: columnKey, px: Math.max(MIN_COLUMN_WIDTH, Math.round(startW)) });
          e.preventDefault();
        },
        onPointerMove: (e) => {
          const d = dragRef.current;
          if (!d) return;
          setDrag({
            key: d.key,
            px: Math.max(MIN_COLUMN_WIDTH, Math.round(d.startW + e.clientX - d.startX))
          });
        },
        onPointerUp: (e) => {
          const d = dragRef.current;
          if (!d) return;
          const px = Math.max(MIN_COLUMN_WIDTH, Math.round(d.startW + e.clientX - d.startX));
          dragRef.current = null;
          setDrag(null);
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
  return { widthOf, resizeHandle };
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

// src/list/columnWidth.ts
var DEFAULT_ACTION_COLUMN_WIDTH = 56;
function resolveColumnWidth(col, stored) {
  return stored ?? col.width ?? (col.action && !col.header ? DEFAULT_ACTION_COLUMN_WIDTH : void 0);
}
function visibleColumnsOf(columns, hidden) {
  return hidden?.length ? columns.filter((c) => c.primary || !hidden.includes(c.key)) : columns;
}

// src/primitives/table.tsx
import "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function Table({
  className,
  containerClassName,
  ...props
}) {
  return /* @__PURE__ */ jsx5(
    "div",
    {
      "data-slot": "table-container",
      className: cn("relative w-full", containerClassName ?? "overflow-x-auto"),
      children: /* @__PURE__ */ jsx5(
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
  return /* @__PURE__ */ jsx5("thead", { "data-slot": "table-header", className: cn("[&_tr]:border-b", className), ...props });
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx5(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx5(
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
  return /* @__PURE__ */ jsx5(
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
  return /* @__PURE__ */ jsx5(
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
import { jsx as jsx6, jsxs as jsxs3 } from "react/jsx-runtime";
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
  stickyHeader,
  stickyHeaderTop,
  className,
  labels: labelsProp
}) {
  const { Link, navigate } = useUi();
  const labels = useLabels(labelsProp);
  const { widthOf, resizeHandle } = useColumnResize({ columnWidths, onColumnWidthsChange });
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
    return /* @__PURE__ */ jsx6(Link, { href, className: "min-w-0 rounded-sm", onClick: (e) => e.stopPropagation(), children: col.cell(row) });
  }
  function renderCardTitle(col, row, href) {
    if (!href || col.noRowLink) {
      return /* @__PURE__ */ jsx6("div", { className: cn(col.noRowLink && href ? "min-w-0" : "truncate", "font-medium"), children: col.cell(row) });
    }
    return /* @__PURE__ */ jsx6(
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
          /* @__PURE__ */ jsx6(
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
  function colWidth(col) {
    return resolveColumnWidth(col, widthOf(col.key));
  }
  const visibleColumns = visibleColumnsOf(columns, hiddenColumns);
  const mobileColumns = visibleColumns.filter((c) => !c.hideOnMobile);
  const primary = mobileColumns.find((c) => c.primary);
  const actions = mobileColumns.filter((c) => c.action);
  const body = mobileColumns.filter((c) => !c.primary && !c.action);
  const stickyHeadClass = stickyHeader ? "sticky z-10 border-b bg-background" : void 0;
  const stickyHeadStyle = stickyHeader ? { top: (stickyHeaderTop ?? 0) - 1 } : void 0;
  const fixedCellClass = resizable ? "overflow-hidden text-ellipsis" : void 0;
  const lastVisibleKey = visibleColumns[visibleColumns.length - 1]?.key;
  const columnsMenu = onHiddenColumnsChange && onColumnsReset ? /* @__PURE__ */ jsx6(
    ColumnsMenu,
    {
      columns,
      hidden: hiddenColumns ?? [],
      onHiddenChange: onHiddenColumnsChange,
      onReset: onColumnsReset,
      labels: labelsProp
    }
  ) : null;
  const menuHeadStyle = { ...stickyHeadStyle, right: 0 };
  return (
    // @container + @3xl (48rem, el mismo valor que `md`) en vez de `md:`: el
    // breakpoint miraba el VIEWPORT, pero el hueco real es el viewport menos el
    // sidebar (~300 px) menos el padding. A 1024 px de viewport la tabla solo
    // tenía 703 px, se pasaba de largo y lo que caía por el borde derecho era
    // siempre la columna de acciones, tras un scroll horizontal que nadie ve.
    // Midiendo el contenedor, una lista metida en una tarjeta estrecha también
    // acierta — el caso de las sedes en Ajustes → Taller, con 302 px.
    /* @__PURE__ */ jsxs3("div", { className: cn("@container", className), children: [
      /* @__PURE__ */ jsx6("div", { className: "hidden @3xl:block", children: /* @__PURE__ */ jsxs3(
        Table,
        {
          containerClassName: stickyHeader ? "overflow-visible" : void 0,
          className: cn(
            stickyHeader && "border-separate border-spacing-0 [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0",
            resizable && "table-fixed"
          ),
          children: [
            resizable && /* @__PURE__ */ jsxs3("colgroup", { children: [
              leading && /* @__PURE__ */ jsx6("col", { style: { width: 40 } }),
              visibleColumns.map((col) => {
                const width = colWidth(col);
                return /* @__PURE__ */ jsx6("col", { style: width ? { width } : void 0 }, col.key);
              }),
              columnsMenu && /* @__PURE__ */ jsx6("col", { style: { width: 44 } })
            ] }),
            /* @__PURE__ */ jsx6(TableHeader, { className: stickyHeader ? "[&_tr]:border-b-0" : void 0, children: /* @__PURE__ */ jsxs3(TableRow, { className: stickyHeader ? "hover:bg-transparent" : void 0, children: [
              leading && /* @__PURE__ */ jsx6(TableHead, { className: cn("w-10", stickyHeadClass), style: stickyHeadStyle }),
              visibleColumns.map((col) => /* @__PURE__ */ jsxs3(
                TableHead,
                {
                  className: cn(
                    // `relative` ANTES de `sticky` (stickyHeadClass): con las
                    // dos, tailwind-merge se queda con la última y sticky es
                    // también contenedor del asa absoluta.
                    resizable && "relative",
                    fixedCellClass,
                    col.sortable && onSortChange && "group",
                    col.headClassName,
                    stickyHeadClass
                  ),
                  style: stickyHeadStyle,
                  "aria-sort": ariaSort(col),
                  children: [
                    renderHead(col),
                    resizable && col.key !== lastVisibleKey && resizeHandle(col.key)
                  ]
                },
                col.key
              )),
              columnsMenu && /* @__PURE__ */ jsxs3(
                TableHead,
                {
                  className: cn(
                    "sticky z-20 w-11 bg-background p-0 text-center",
                    stickyHeader && "border-b"
                  ),
                  style: menuHeadStyle,
                  children: [
                    /* @__PURE__ */ jsx6("span", { className: "sr-only", children: labels.columnsMenu }),
                    columnsMenu
                  ]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx6(TableBody, { children: data.map((row) => {
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
                    /* @__PURE__ */ jsx6(
                      TableCell,
                      {
                        onClick: (e) => e.stopPropagation(),
                        onAuxClick: (e) => e.stopPropagation(),
                        children: leading(row)
                      }
                    ),
                    visibleColumns.map((col) => /* @__PURE__ */ jsx6(
                      TableCell,
                      {
                        className: cn(
                          // Las `action` quedan fuera del recorte con elipsis: son
                          // botones (con o sin texto), no texto que deba acortarse.
                          // Sin esto un botón «Presupuesto de venta» dentro de una
                          // columna estrecha se recortaba a media palabra.
                          fixedCellClass && !col.action && fixedCellClass,
                          col.cellClassName
                        ),
                        children: renderCell(col, row, href)
                      },
                      col.key
                    )),
                    columnsMenu && /* @__PURE__ */ jsx6(TableCell, { className: "p-0" })
                  ]
                },
                rowKey(row)
              );
            }) })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs3("div", { className: "space-y-2 @3xl:hidden", children: [
        mobileColumnsMenu && columnsMenu && /* @__PURE__ */ jsx6("div", { className: "flex justify-end", "data-list-columns-menu": true, children: columnsMenu }),
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
                    leading && /* @__PURE__ */ jsx6(
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
                  /* @__PURE__ */ jsx6("div", { className: "flex max-w-full shrink-0 flex-wrap items-center gap-1", children: actions.map((col) => /* @__PURE__ */ jsx6("span", { children: col.cell(row) }, col.key)) })
                ] }),
                body.length > 0 && /* @__PURE__ */ jsx6("dl", { className: "mt-2 space-y-1", children: body.filter((col) => !col.mobileHideWhen?.(row)).map((col) => /* @__PURE__ */ jsxs3(
                  "div",
                  {
                    className: cn(
                      col.mobileFullWidth ? "space-y-1" : "flex justify-between gap-3"
                    ),
                    children: [
                      !col.mobileHideLabel && col.header && /* @__PURE__ */ jsx6(
                        "dt",
                        {
                          className: cn(
                            "text-muted-foreground",
                            col.mobileFullWidth ? "text-xs font-medium uppercase tracking-wide" : "shrink-0"
                          ),
                          children: col.header
                        }
                      ),
                      /* @__PURE__ */ jsx6(
                        "dd",
                        {
                          className: cn(
                            "min-w-0 break-words",
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
    ] })
  );
}

// src/list/pagination.tsx
import { useEffect } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
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
    /* @__PURE__ */ jsx7(
      Button,
      {
        variant: "outline",
        size: "sm",
        disabled: page <= 1,
        onClick: () => onPageChange(1),
        "aria-label": labels.paginationFirst,
        title: labels.paginationFirst,
        children: /* @__PURE__ */ jsx7(ChevronsLeft, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsx7(
      Button,
      {
        variant: "outline",
        size: "sm",
        disabled: page <= 1,
        onClick: () => onPageChange(page - 1),
        "aria-label": labels.paginationPrev,
        title: labels.paginationPrev,
        children: /* @__PURE__ */ jsx7(ChevronLeft, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsx7("span", { className: "px-2 text-sm text-muted-foreground tabular-nums", children: truncated ? labels.paginationRangeTruncated(from, to, total) : labels.paginationRange(from, to, total) }),
    /* @__PURE__ */ jsx7(
      Button,
      {
        variant: "outline",
        size: "sm",
        disabled: page >= lastPage,
        onClick: () => onPageChange(page + 1),
        "aria-label": labels.paginationNext,
        title: labels.paginationNext,
        children: /* @__PURE__ */ jsx7(ChevronRight, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsx7(
      Button,
      {
        variant: "outline",
        size: "sm",
        disabled: page >= lastPage,
        onClick: () => onPageChange(lastPage),
        "aria-label": labels.paginationLast,
        title: labels.paginationLast,
        children: /* @__PURE__ */ jsx7(ChevronsRight, { className: "size-4" })
      }
    )
  ] });
}

// src/list/usePagination.ts
import { useState as useState2 } from "react";

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

// src/list/usePagination.ts
var DEFAULT_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
function usePagination(deps = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState2(1);
  const key = JSON.stringify([deps, pageSize]);
  const [prevKey, setPrevKey] = useState2(key);
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
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
function Select({ ...props }) {
  return /* @__PURE__ */ jsx8(SelectPrimitive.Root, { "data-slot": "select", ...props });
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
        /* @__PURE__ */ jsx8(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx8(ChevronDownIcon, { className: "pointer-events-none size-4 text-muted-foreground" }) })
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
  return /* @__PURE__ */ jsx8(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs5(
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
        /* @__PURE__ */ jsx8(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx8(
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
        /* @__PURE__ */ jsx8(SelectScrollDownButton, {})
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
        /* @__PURE__ */ jsx8("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center", children: /* @__PURE__ */ jsx8(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx8(CheckIcon2, { className: "pointer-events-none" }) }) }),
        /* @__PURE__ */ jsx8(SelectPrimitive.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx8(
    SelectPrimitive.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx8(ChevronUpIcon, {})
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx8(
    SelectPrimitive.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx8(ChevronDownIcon, {})
    }
  );
}

// src/list/ListFooter.tsx
import { Fragment, jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
function ListFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  hidden,
  onHiddenChange,
  onReset,
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
  const status = isEmpty ? labels.noResults : truncated ? labels.countTruncated(total) : labels.count(total);
  return (
    // El `@container` va aquí y el layout en el hijo: un elemento no puede
    // consultarse a sí mismo.
    /* @__PURE__ */ jsx9("div", { className: cn("@container", className), children: /* @__PURE__ */ jsxs6(
      "div",
      {
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 pt-2",
          "@2xl:grid @2xl:grid-cols-[1fr_auto_1fr]"
        ),
        children: [
          /* @__PURE__ */ jsx9("span", { className: "hidden @2xl:block", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx9("span", { role: "status", className: "sr-only", children: status }),
          /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-center gap-2", children: [
            showCountOnly && /* @__PURE__ */ jsx9("span", { className: "text-sm text-muted-foreground tabular-nums", children: truncated ? labels.countTruncated(total) : labels.count(total) }),
            /* @__PURE__ */ jsx9(
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
            /* @__PURE__ */ jsx9(
              "span",
              {
                "aria-live": "polite",
                className: "inline-flex size-4 shrink-0 items-center justify-center",
                children: loading && /* @__PURE__ */ jsxs6(Fragment, { children: [
                  /* @__PURE__ */ jsx9(Loader2, { className: "size-4 animate-spin text-muted-foreground" }),
                  /* @__PURE__ */ jsx9("span", { className: "sr-only", children: labels.loading })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "ml-auto flex items-center gap-2 @2xl:ml-0 @2xl:justify-self-end", children: [
            /* @__PURE__ */ jsx9(
              ColumnsMenu,
              {
                className: isEmpty ? void 0 : "@3xl:hidden",
                columns,
                hidden,
                onHiddenChange,
                onReset,
                labels: labelsProp
              }
            ),
            !isEmpty && /* @__PURE__ */ jsxs6(Select, { value: String(pageSize), onValueChange: (v) => onPageSizeChange(Number(v)), children: [
              /* @__PURE__ */ jsxs6(SelectTrigger, { "aria-label": label, title: label, className: "tabular-nums", children: [
                /* @__PURE__ */ jsx9("span", { className: "@md:hidden", children: pageSize }),
                /* @__PURE__ */ jsx9("span", { className: "hidden @md:inline", children: labels.pageSizeValue(pageSize) })
              ] }),
              /* @__PURE__ */ jsx9(SelectContent, { align: "end", position: "popper", children: LIST_PAGE_SIZES.map((size) => /* @__PURE__ */ jsx9(SelectItem, { value: String(size), className: "tabular-nums", children: labels.pageSizeValue(size) }, size)) })
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
import { useCallback, useEffect as useEffect2, useMemo, useRef as useRef2, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
function storageKey(listKey) {
  return `${LIST_PREFS_STORAGE_PREFIX}${listKey}`;
}
function readSnapshot(listKey) {
  if (!memory.has(listKey)) memory.set(listKey, safeStorage.getItem(storageKey(listKey)));
  return memory.get(listKey) ?? null;
}
function notify(listKey) {
  listeners.get(listKey)?.forEach((cb) => cb());
}
function writeLocal(listKey, prefs) {
  const raw = JSON.stringify(prefs);
  if (memory.get(listKey) === raw) return;
  memory.set(listKey, raw);
  safeStorage.setItem(storageKey(listKey), raw);
  notify(listKey);
}
function subscribe(listKey, cb) {
  let set = listeners.get(listKey);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    listeners.set(listKey, set);
  }
  set.add(cb);
  const onStorage = (e) => {
    if (e.key !== storageKey(listKey)) return;
    memory.set(listKey, e.newValue);
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
  const storeRef = useRef2(store);
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
    useCallback((cb) => subscribe(listKey, cb), [listKey]),
    () => readSnapshot(listKey),
    () => null
  );
  const prefs = useMemo(() => normalize(parse(snapshot)), [normalize, snapshot]);
  const current = useCallback(() => normalize(parse(readSnapshot(listKey))), [normalize, listKey]);
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
  const reconciledRef = useRef2(null);
  useEffect2(() => {
    if (!userId || !query.isSuccess) return;
    const tag = `${userId}:${listKey}`;
    if (reconciledRef.current === tag) return;
    reconciledRef.current = tag;
    const local = current();
    if (query.data) {
      const next = normalize(query.data.prefs);
      if (!listPrefsEqual(next, local)) writeLocal(listKey, next);
    } else if (!listPrefsEqual(local, normalize(null))) {
      void storeRef.current.save(listKey, local);
    }
  }, [userId, listKey, query.isSuccess, query.data, normalize, current]);
  const timerRef = useRef2(null);
  const pendingRef = useRef2(null);
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
      writeLocal(listKey, next);
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
    [listKey, commit]
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
  const reset = useCallback(
    () => persist({ ...current(), hidden: [], widths: {} }, { debounce: false }),
    [persist, current]
  );
  return {
    prefs,
    setHidden,
    setWidths,
    setSort,
    setPageSize,
    reset,
    isLoaded: !userId || query.isSuccess || query.isError
  };
}

// src/list/useListView.ts
function useListView(listKey, {
  columnKeys,
  defaults,
  deps = [],
  paginated = true,
  stickyHeader = true,
  store
}) {
  const listPrefs = useListPrefs(listKey, { columnKeys, defaults, store });
  const { prefs, setSort, setWidths, setHidden, setPageSize, reset } = listPrefs;
  const { sort, hidden, widths, pageSize } = prefs;
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
      stickyHeader
    }),
    [sort, setSort, widths, setWidths, hidden, setHidden, reset, paginated, stickyHeader]
  );
  const footerProps = useMemo2(
    () => ({
      page,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
      hidden,
      onHiddenChange: setHidden,
      onReset: reset
    }),
    [page, pageSize, setPage, setPageSize, hidden, setHidden, reset]
  );
  const base = { prefs, sort, listProps, isLoaded: listPrefs.isLoaded };
  if (!paginated) return base;
  return { ...base, pageSize, page, setPage, from, to, footerProps };
}

// src/list/useListColumns.ts
function useListColumns(listKey, columnKeys, { store } = {}) {
  const { prefs, setHidden, setWidths, reset } = useListPrefs(listKey, { columnKeys, store });
  return {
    resizable: true,
    columnWidths: prefs.widths,
    onColumnWidthsChange: setWidths,
    hiddenColumns: prefs.hidden,
    onHiddenColumnsChange: setHidden,
    onColumnsReset: reset
  };
}

// src/prefs/useSupabaseListPrefsStore.ts
import { useEffect as useEffect3, useMemo as useMemo3, useRef as useRef3, useState as useState3 } from "react";
function useSupabaseListPrefsStore(client, { table, onError } = {}) {
  const [userId, setUserId] = useState3(null);
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
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);
  const onErrorRef = useRef3(onError);
  useEffect3(() => {
    onErrorRef.current = onError;
  });
  return useMemo3(
    () => createSupabaseListPrefsStore(client, userId, {
      table,
      onError: (error) => {
        const handler = onErrorRef.current;
        if (handler) handler(error);
        else defaultOnError(error);
      }
    }),
    [client, userId, table]
  );
}

export {
  safeStorage,
  cn,
  ColumnsMenu,
  MIN_COLUMN_WIDTH,
  useColumnResize,
  TINTED_ROW_CLASS,
  rowTone,
  DEFAULT_ACTION_COLUMN_WIDTH,
  resolveColumnWidth,
  visibleColumnsOf,
  TOUCH_TEXT_LINK,
  ResponsiveList,
  Pagination,
  LIST_PAGE_SIZES,
  DEFAULT_LIST_PAGE_SIZE,
  isListPageSize,
  LIST_PREFS_STORAGE_PREFIX,
  normalizeListPrefs,
  listPrefsEqual,
  resolveListDefaults,
  EMPTY_LIST_PREFS,
  DEFAULT_PAGE_SIZE,
  usePagination,
  ListFooter,
  localOnlyListPrefsStore,
  createSupabaseListPrefsStore,
  LIST_PREFS_WIDTHS_DEBOUNCE_MS,
  useListPrefs,
  useListView,
  useListColumns,
  useSupabaseListPrefsStore
};

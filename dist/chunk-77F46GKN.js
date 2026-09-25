"use client";

// src/context/UiProvider.tsx
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var defaultLabels = {
  columnsMenu: "Columnas",
  columnsReset: "Restablecer columnas",
  paginationFirst: "Primera p\xE1gina",
  paginationPrev: "P\xE1gina anterior",
  paginationNext: "P\xE1gina siguiente",
  paginationLast: "\xDAltima p\xE1gina",
  paginationRange: (from, to, total) => `${from}\u2013${to} de ${total}`,
  paginationRangeTruncated: (from, to, total) => `${from}\u2013${to} de los primeros ${total}`,
  count: (count) => count === 1 ? "1 resultado" : `${count} resultados`,
  countTruncated: (count) => count === 1 ? "solo el primer resultado" : `solo los primeros ${count} resultados`,
  pageSizeLabel: "Filas por p\xE1gina",
  pageSizeValue: (count) => `${count} por p\xE1gina`,
  noResults: "Sin resultados",
  loading: "Cargando\u2026",
  versionMessage: "Hay una versi\xF3n nueva de la aplicaci\xF3n",
  versionAction: "Actualizar"
};
function DefaultLink({ href, ...props }) {
  return /* @__PURE__ */ jsx("a", { href, ...props });
}
function defaultNavigate(href) {
  window.location.assign(href);
}
var defaultValue = {
  Link: DefaultLink,
  navigate: defaultNavigate,
  labels: defaultLabels
};
var UiContext = React.createContext(defaultValue);
function sameLabelShape(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    const va = a[k];
    const vb = b[k];
    if (typeof va === "function" && typeof vb === "function") continue;
    if (va !== vb) return false;
  }
  return true;
}
function UiProvider({ Link, navigate, labels, listPrefsStore, children }) {
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;
  const labelsRef = React.useRef(labels);
  labelsRef.current = labels;
  const stableNavigate = React.useCallback((href) => {
    ;
    (navigateRef.current ?? defaultNavigate)(href);
  }, []);
  const [stableLabels, setStableLabels] = React.useState(labels);
  let shapeLabels = stableLabels;
  if (!sameLabelShape(stableLabels, labels)) {
    shapeLabels = labels;
    setStableLabels(labels);
  }
  const resolvedLabels = React.useMemo(() => {
    if (!shapeLabels) return defaultLabels;
    const out = { ...defaultLabels };
    for (const k of Object.keys(shapeLabels)) {
      const v = shapeLabels[k];
      if (v === void 0) continue;
      out[k] = typeof v === "function" ? (...args) => {
        const latest = labelsRef.current?.[k];
        const fn = typeof latest === "function" ? latest : v;
        return fn(...args);
      } : v;
    }
    return out;
  }, [shapeLabels]);
  const value = React.useMemo(
    () => ({
      Link: Link ?? DefaultLink,
      navigate: stableNavigate,
      labels: resolvedLabels,
      listPrefsStore
    }),
    [Link, stableNavigate, resolvedLabels, listPrefsStore]
  );
  return /* @__PURE__ */ jsx(UiContext.Provider, { value, children });
}
function useUi() {
  return React.useContext(UiContext);
}
function useLabels(override) {
  const { labels } = useUi();
  return React.useMemo(() => override ? { ...labels, ...override } : labels, [labels, override]);
}

export {
  defaultLabels,
  UiProvider,
  useUi,
  useLabels
};

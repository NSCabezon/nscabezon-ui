"use client";

// src/context/UiProvider.tsx
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var defaultLabels = {
  columnsMenu: "Columnas",
  columnsReset: "Restablecer columnas",
  paginationFirst: "Primera p\xE1gina",
  paginationPrev: "Anterior",
  paginationNext: "Siguiente",
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
function UiProvider({ Link, navigate, labels, listPrefsStore, children }) {
  const value = React.useMemo(
    () => ({
      Link: Link ?? DefaultLink,
      navigate: navigate ?? defaultNavigate,
      labels: labels ? { ...defaultLabels, ...labels } : defaultLabels,
      listPrefsStore
    }),
    [Link, navigate, labels, listPrefsStore]
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

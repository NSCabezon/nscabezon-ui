# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
el proyecto sigue [semver](https://semver.org/lang/es/).

## [0.1.1] - 2026-09-25

### Añadido

- `useSupabaseListPrefsStore(client, options?)`: hook que sigue al usuario con
  sesión (`getSession` al montar + `onAuthStateChange`, con baja al desmontar)
  y devuelve el almacén de Supabase memoizado (`userId` `null` sin sesión).
  Cliente tipado a mano (`SupabaseLikeAuthClient`): sin import de
  `@supabase/supabase-js` en tiempo de ejecución y sin TanStack Query.
  `createSupabaseListPrefsStore` se mantiene.
- `CHANGELOG.md`.

### Cambiado

- `ResponsiveList.mobileColumnsMenu` pasa a estar **activo por defecto** cuando
  la lista permite ocultar columnas (`onHiddenColumnsChange` +
  `onColumnsReset`); `mobileColumnsMenu={false}` lo quita.
- `useListView` incluye `mobileColumnsMenu` en `listProps`: `false` en modo
  paginado (el `ListFooter` ya pinta el menú en móvil) y `true` con
  `paginated: false`.
- `UiProvider`: el valor del contexto solo cambia con `Link`,
  `listPrefsStore` o el contenido de `labels`. `navigate` y las
  etiquetas-función se exponen como delegados estables, así que se pueden
  pasar en línea sin memoizar.
- Textos por defecto de paginación: «Página anterior» / «Página siguiente»
  (antes «Anterior» / «Siguiente»).
- README: instalación con `git+https://github.com/NSCabezon/nscabezon-ui.git#vX.Y.Z`
  y nota sobre el `resolved` del lock (`git+ssh` → `git+https`).

## [0.1.0] - 2026-09-25

Primera versión, extraída de Gesmoto con aportes de TusExámenes.

- `UiProvider` (Link, navigate, textos, almacén de preferencias), `useUi`,
  `useLabels`, `defaultLabels`.
- `ResponsiveList` (tabla en escritorio / tarjetas en móvil, orden servidor,
  anchos arrastrables, columnas ocultas con menú incrustado, cabecera fija,
  filas teñidas, `rowHref`), `ColumnsMenu`, `useColumnResize` y helpers de
  columnas.
- `Pagination`, `usePagination`, `ListFooter`.
- `useListView`, `useListColumns`, `useListPrefs` (caché local con
  `useSyncExternalStore` + sincronización remota), `createSupabaseListPrefsStore`,
  `localOnlyListPrefsStore`.
- `useVersionCheck`, `fetchVersionJson`.
- Subruta `@nscabezon/ui/storage` sin `"use client"` para código de servidor.

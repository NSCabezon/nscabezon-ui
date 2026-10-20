# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
el proyecto sigue [semver](https://semver.org/lang/es/).

## [0.5.0] - 2026-10-20

### Cambiado

- Redimensionar columnas (`resizable`): al arrastrar el borde de una columna
  ya no se reparten el cambio las demás. Solo cambian la arrastrada y la
  **columna flexible**; el resto se queda con el ancho que tenía (las que iban
  sin ancho se fijan en px al empezar y se guardan así al soltar). La tabla
  sigue llenando el ancho, sin scroll lateral, y al cambiar el ancho de la
  ventana solo cambia la flexible.
  - Flexible = la marcada con `flex: true`; si ninguna, la `primary` sin
    `width`; si no, la primera columna no-`action` sin `width`; si todas
    tienen `width`, ninguna (comportamiento anterior).
  - No baja de su `minWidth` (por defecto 96 px): llegado ahí, la arrastrada
    deja de crecer.
  - Arrastrar la propia flexible: compensa la última columna no-`action` sin
    `width` o, si no hay, su vecina de la derecha.
  - La flexible nunca se guarda en `ListPrefs.widths` (un ancho antiguo para
    ella se ignora y se limpia al guardar). Doble clic en el asa,
    «Restablecer columnas», modo compacto y reordenar, igual que antes.

### Añadido

- `ResponsiveColumn.flex` y `ResponsiveColumn.minWidth`.
- `useColumnResize`: opción `columns` (columnas visibles, en orden) que activa
  el modo de columna flexible; devuelve además `colWidth(key)` (ancho resuelto
  para el `<col>`) y `flexKey`. Los `<th>` se miden por
  `data-column-width-key` (`COLUMN_WIDTH_KEY_ATTR`). Sin `columns`, igual que
  antes.
- `resolveFlexColumnKey`, `flexAbsorberKey`, `FLEX_MIN_COLUMN_WIDTH` y el tipo
  `SizedColumn` exportados (también desde `@nscabezon/ui/storage`).

## [0.4.0] - 2026-10-20

### Añadido

- Columnas reordenables por usuario, en todos los listados de `useListView`
  (sin opt-in).
  - `ListPrefs.order: string[]` (claves; `[]` = orden de serie; también en
    `ListPrefsDefaults`, `EMPTY_LIST_PREFS` y `listPrefsEqual`).
    `normalizeListPrefs` quita claves desconocidas y repetidas y añade al
    final las columnas conocidas que falten (columnas nuevas); si no es un
    array, `[]`. Viaja en el jsonb de `user_list_prefs`: sin migración.
  - `useListPrefs`: `setOrder(keys)`, al instante (sin debounce). `reset()`
    («Restablecer columnas») ahora también vacía `order`; sigue sin tocar
    orden de filas, tamaño de página ni compacto.
  - `ResponsiveList`: props `columnOrder` / `onColumnOrderChange`. El orden se
    aplica a cabeceras, celdas, `<colgroup>` y al `<dl>` de la tarjeta móvil
    (el título sigue siendo la `primary`, que en la tabla puede ir en
    cualquier posición). Las columnas `action` y la del menú no se mueven.
    Con el callback, en escritorio la cabecera se arrastra (HTML5 drag and
    drop nativo, sin dependencias): `cursor-grab`, la columna arrastrada al
    50 % y una línea `bg-primary` en el borde donde cae (detrás del destino si
    venía de la izquierda, delante si venía de la derecha). Un clic sin mover
    sigue ordenando y el asa de redimensión no inicia arrastre.
  - `ColumnsMenu`: props `columnOrder` / `onColumnOrderChange`; la lista sale
    en el orden actual y, con el callback, cada columna no-`action` lleva
    «Subir»/«Bajar» (items del menú: la vía de teclado), deshabilitados en los
    extremos y sin cerrar el menú. `ColumnsMenuColumn.action` opcional.
    Textos nuevos `Labels.columnMoveUp` / `columnMoveDown`
    (`(column) => string`; por defecto «Subir X» / «Bajar X»).
  - `ListFooter`: props `columnOrder` / `onColumnOrderChange` para su menú.
  - `useListView`: `listProps` y `footerProps` llevan `columnOrder` +
    `onColumnOrderChange`; el resultado expone `order`. `useListColumns`
    también los devuelve.
  - `orderColumns(columns, order)` y `moveColumn(columns, order, from, to)`
    exportados (para tablas hechas a mano).
  - El asa de `useColumnResize` lleva `data-column-resize-handle`.

## [0.3.0] - 2026-10-20

### Añadido

- Modo compacto de listado (opt-in por listado): cada fila en una línea.
  - `ListPrefs.compact` (booleano, por defecto `false`; también en
    `ListPrefsDefaults`, `EMPTY_LIST_PREFS` y `listPrefsEqual`).
    `normalizeListPrefs` descarta lo que no sea booleano. Viaja en el jsonb de
    `user_list_prefs`: sin migración.
  - `useListPrefs`: `setCompact(v)`, al instante (sin debounce). `reset()`
    («Restablecer columnas») no lo toca.
  - `ColumnsMenu`: props `compact` / `onCompactChange`; con el callback pinta
    la casilla «Modo compacto» encima de «Restablecer columnas», sin cerrar el
    menú. Texto nuevo `Labels.compactMode` («Modo compacto»).
  - `ResponsiveList`: props `compact` / `onCompactChange` (llegan al menú de
    la cabecera y al de móvil). Con `compact`, `data-compact` en la tabla y en
    cada tarjeta; en escritorio las celdas no-`action` van `whitespace-nowrap
    overflow-hidden text-ellipsis` y las cabeceras `whitespace-nowrap` (ganan a
    un `cellClassName`/`headClassName` con `whitespace-normal`); en móvil los
    `<dd>` van con `truncate` y las acciones de la tarjeta sin `flex-wrap`.
  - `useListCompact()`: hook para que una `cell` sepa si su lista va en
    compacto (lo provee `ResponsiveList`).
  - `ListFooter`: props `compact` / `onCompactChange` para su menú de columnas.
  - `useListView`: opción `compactable` (por defecto `false`). Solo con ella
    `listProps` y `footerProps` llevan `compact` + `onCompactChange`; el
    resultado expone `compact` (`false` si el listado no es compactable).

## [0.2.2] - 2026-10-20

### Añadido

- `LIST_PAGE_SIZES` incluye 100: el selector «Filas por página» ofrece 10 · 25 · 50 · 100.

## [0.2.1] - 2026-10-08

### Corregido

- A11Y-7: `ResponsiveList` ya no pinta `<th>` vacíos. La columna `leading`
  lleva un `sr-only` con `labels.selectColumn` y las columnas `action` sin
  `header` uno con `labels.actionsColumn`.
- A11Y-7b: el selector «Filas por página» de `ListFooter` mide 44 px en
  puntero táctil (`pointer-coarse:min-h-11 min-w-11`).

### Añadido

- `Labels`: `actionsColumn` («Acciones») y `selectColumn` («Seleccionar»).

## [0.2.0] - 2026-09-27

### Añadido

- Subruta `@nscabezon/ui/auth` (cliente, `"use client"`): `OAuthButtons`, los
  botones «Continuar con Google / Apple» que vivían duplicados en las apps.
  Recibe el cliente de Supabase tipado a mano (`OAuthSignInClient`, sin
  importar `@supabase/supabase-js`), `redirectTo` (cadena o función evaluada
  al click), `providers`, `lastMethod` (etiqueta «Última vez»),
  `rememberLastMethod`, `onBeforeRedirect`, `onError` (por defecto
  `toast.error` de sonner), `divider`, `providerOptions` y `labels`.
- `GoogleIcon` y `AppleIcon`.
- `getLastAuthMethod` / `setLastAuthMethod` (sobre `safeStorage`, clave
  `ui.lastAuthMethod` configurable), tipos `AuthMethod` y `OAuthProvider`.
  También en `@nscabezon/ui/storage`.
- `Labels`: `oauthDivider`, `oauthGoogle`, `oauthApple`, `lastUsed`.

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

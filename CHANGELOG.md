# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
el proyecto sigue [semver](https://semver.org/lang/es/).

## [0.9.1] - 2026-10-20

### Cambiado

- El recuento del pie («N resultados») lleva 2 pt de margen vertical.

## [0.9.0] - 2026-10-20

Nuevo modelo de anchos de `resizable`: **«como Excel + relleno»**. El de
v0.5.0 («solo cambia la arrastrada y la flexible absorbe para mantener el
100 %») se rompía: con dos columnas sin `width`, con la flexible en su mínimo
(no podías ensanchar otra) y con anchos guardados del modelo anterior. Incluye
lo que iba a ser 0.8.1 (suelo `minWidth` en cualquier columna), que no se
publica por separado.

> **Consumidores: marcad `fill: true` en la columna de texto principal de
> cada listado `resizable`** (descripción, cliente, nombre…). **Nunca en el
> Nº** ni en importes/fechas. Sin ninguna marcada no hay relleno y queda hueco
> a la derecha; la `primary` ya no se elige sola. Revisad también las
> columnas sin `width`: ahora miden 160 px por defecto (antes repartían el
> sobrante); dadles `width` si 160 no les va.

### Cambiado

- Arrastrar el borde de una columna cambia **solo esa columna**: ninguna
  otra se mueve ni encoge, y no hay tope por «otra columna en su mínimo».
- La tabla mide máx(contenedor, suma de anchos): si la suma no cabe, scroll
  horizontal (también con `stickyHeader`, en el contenedor de scroll del
  consumidor; el botón del menú sigue anclado a la última cabecera).
- Todas las columnas tienen ancho efectivo: guardado, `width` o
  `DEFAULT_COLUMN_WIDTH` (160 px; las `action` sin cabecera, 56).
  `resolveColumnWidth` devuelve siempre un número.
- Técnica: `<col>` con ancho en px en todas salvo la de relleno; la tabla,
  `width: 100%; min-width: <suma>` con relleno o `width: <suma>` sin él
  (`tableSizing`).
- `useColumnResize`: con `columns`, el arrastre solo guarda la arrastrada
  (ya no fija en px las columnas sin ancho ni guarda la «que compensa»).
  Devuelve `fillKey`, `totalWidth` y `tableStyle(extraPx)`.
- Botón del menú de columnas (v0.6.0): sin `bg-background` fijo. Hereda
  (`bg-inherit`, igual que `<th>`, `<tr>` y `<thead>`) el fondo real de su
  cabecera: tarjeta `bg-card`, `headClassName` con `bg-*`, modo oscuro…; si la
  cabecera es transparente, el botón también. La cabecera fija
  (`stickyHeader`) usa `var(--list-head-bg)` → `--color-card` dentro de un
  `.bg-card` (automático) → `--color-background`. Un `bg-*` en
  `headClassName` gana ahora también a la cabecera fija.

### Añadido

- `fill?: boolean` en `ResponsiveColumn` / `SizedColumn`: la columna de
  relleno (una por tabla; si hay varias, la primera).
- `minWidth` vale para **cualquier** columna (antes solo para la flexible):
  suelo del arrastre y del ancho pintado, también del guardado en
  `columnWidths` (una fecha guardada a 105 px cortaba «19/10/2…»). Sin
  `minWidth`, suelo de 64 px (o el propio ancho por defecto si es menor).
- Exports: `DEFAULT_COLUMN_WIDTH`, `columnFloor`, `isFillColumn`,
  `resolveFillColumnKey`, `tableSizing`; `MIN_COLUMN_WIDTH` también desde
  `@nscabezon/ui/storage`.

### Deprecado

- `flex` en las columnas: alias de `fill` (misma semántica nueva: relleno,
  no «absorbe al arrastrar»). `flexKey` del hook: alias de `fillKey`.

### Eliminado

- `resolveFlexColumnKey`, `flexAbsorberKey` y `FLEX_MIN_COLUMN_WIDTH` (la
  lógica de absorber ya no existe).

## [0.8.0] - 2026-10-20

Los listados «bailaban»: las preferencias del servidor (anchos, orden de
columnas, compacto, ocultas, orden, filas por página) se aplicaban después del
primer pintado, y la caché local no era por usuario.

> **Consumidores: pasad `enabled: view.ready` a la consulta del listado.**
> Mientras `view.ready` es `false`, `sort`/`from`/`to` son los por defecto.

### Añadido

- `useListView`: `ready: boolean` (y `isLoaded` se queda como alias). También
  en `listProps.ready`.
- `ResponsiveList`: prop `ready?: boolean` (por defecto `true`). Con `false`
  pinta un esqueleto (`aria-busy`, `data-list-pending`) en vez de la tabla con
  anchos/orden/columnas por defecto.
- `listPrefsStorageKey(userId, listKey)`: la clave local que usa `useListPrefs`.
- `ListPrefsStore.userId` admite `undefined` = usuario aún desconocido.

### Cambiado

- `useListPrefs`: caché local por usuario, `list-prefs:<userId>:<listKey>`
  (sin sesión, `list-prefs:<listKey>` como antes; usuario desconocido, ninguna).
  La caché en memoria se vacía al cambiar de usuario en la misma pestaña.
- `useListPrefs.isLoaded`: `true` solo con caché local de ESTE usuario, con la
  consulta al servidor terminada (con o sin fila, o error) o sin sesión
  (`userId === null`). Antes era `true` también con el usuario sin resolver.
- Migración de la clave vieja `list-prefs:<listKey>`: con usuario no se usa
  para pintar ni se sube a su cuenta (pudo dejarla otro usuario); se borra
  cuando el servidor responde.
- `useSupabaseListPrefsStore`: `userId` es `undefined` mientras `getSession`
  no responde y `null` sin sesión (o si `getSession` falla). Antes, `null`
  desde el principio.
- `ListFooter`/`Pagination`: el recuento «N resultados» y el rango van con
  `tabular-nums` y ancho mínimo fijo en `ch` (texto sin dígitos + 6 / 12
  huecos de dígito): cambiar de dígitos ya no desplaza los botones (~5 px).

## [0.7.0] - 2026-10-20

### Añadido

- `ColumnsMenu`: submenú «Filas por página» › 10 · 25 · 50 · 100
  (`DropdownMenuSub` + `DropdownMenuRadioGroup`, el actual marcado) entre
  «Modo compacto» y «Restablecer columnas», con separadores. Opt-in con las
  props nuevas `pageSize?: number` y `onPageSizeChange?: (n) => void`. El
  submenú va en portal con `collisionPadding` (a 390 px se voltea a la
  izquierda) y abre con toque, hover, →, Enter o Espacio.
- `ResponsiveList`: props `pageSize`/`onPageSizeChange`, que pasan al menú de
  columnas de la cabecera.
- `useListView` (paginado): `listProps` lleva `pageSize` + `onPageSizeChange`;
  `footerProps` los pasa también al menú del pie. Cambiar el tamaño vuelve a
  la página 1, como antes. Con `paginated: false`, nada.
- Label `pageSizeMenu` en `UiProvider` (por defecto «Filas por página»).

### Cambiado

- `ListFooter`: con menú de columnas (`onHiddenChange` + `onReset`) **ya no
  pinta el selector de filas por página**: el tamaño se cambia en el submenú
  del menú de columnas. Sin menú de columnas el selector se queda en el pie.
  `hidden`, `onHiddenChange`, `onReset` y `columns` pasan a ser opcionales en
  `ListFooterProps` (sin los dos callbacks no se pinta el menú). Con 0
  resultados el menú del pie no ofrece el submenú (como antes el selector).
- Pie del listado más bajo: la fila pasa de `pt-2` a `pt-1` (y `gap-y-1` al
  envolver), las flechas de `Pagination` de `size="sm"` a `icon-sm` (28×28
  px) y el botón del menú de columnas del pie a `size-7`. En táctil siguen a
  44 px (`pointer-coarse:min-h-11 min-w-11` de `buttonVariants`). Recuento y
  botones siguen centrados en vertical.

## [0.6.0] - 2026-10-20

### Cambiado

- `ResponsiveList`: el botón del menú de columnas ya **no es una columna**.
  Antes era una columna fija a la derecha (`<col>` de 44 px, `<th>` sticky y
  una celda vacía en cada fila) que reservaba ancho en toda la tabla y se lo
  quitaba a las de datos (en tablas justas se cortaban los estados). Ahora:
  - Sin `<col>` propio ni `<td>` vacíos; el colgroup, la columna flexible y
    las mediciones (`data-column-width-key`) solo cuentan columnas de datos.
  - El botón va dentro de la última `<th>` visible, posicionado `absolute`
    en el borde derecho de la cabecera, con fondo opaco. Esa `<th>` (solo
    la cabecera, nunca las celdas) lleva `pr-10` para que el botón no tape
    el texto ni la flecha de orden, salvo que sea una `action` sin cabecera.
  - Con `stickyHeader` viaja con la cabecera fija. Sin ella, la última `<th>`
    y el contenedor de scroll quedan sin posicionar y el botón se ancla al
    envoltorio de fuera del scroll: se queda en la esquina derecha visible
    aunque la tabla scrollee a lo ancho. El indicador de arrastre de esa
    `<th>` pasa a ser una sombra interior.
  - Mantiene su `aria-label` y en el Tab va detrás de las cabeceras
    ordenables. No arrastra la cabecera ni es zona de soltar.
  - Se quita el `<span class="sr-only">` de la antigua columna (el botón ya
    se nombra con su `aria-label`).
  - Móvil (tarjetas) y `ListFooter`, sin cambios.

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

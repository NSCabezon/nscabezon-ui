# @nscabezon/ui

Componentes y hooks React compartidos entre **Gesmoto** (Vite + react-router) y
**TusExámenes** (Next.js App Router). La fuente original es Gesmoto; de
TusExámenes se incorporan la lectura de preferencias segura para SSR
(`useSyncExternalStore`) y los helpers de ancho de columna.

Paquete privado, solo ESM, distribuido desde git con `dist/` ya compilado (no
hay `prepare`: instalar no compila nada).

## Qué incluye

| Área | Exportaciones |
| --- | --- |
| Integración | `UiProvider`, `useUi`, `useLabels`, `defaultLabels`, tipos `Labels`, `UiLinkProps` |
| Listados | `ResponsiveList` (tabla en escritorio / tarjetas en móvil, orden servidor, anchos arrastrables, columnas ocultas, cabecera fija, filas teñidas, `rowHref`, modo compacto, columnas reordenables), `ColumnsMenu`, `useListCompact`, `orderColumns`, `moveColumn`, `useColumnResize`, `MIN_COLUMN_WIDTH`, `TOUCH_TEXT_LINK`, `rowTone`, `TINTED_ROW_CLASS`, `resolveColumnWidth`, `visibleColumnsOf`, `DEFAULT_ACTION_COLUMN_WIDTH`, `DEFAULT_COLUMN_WIDTH`, `columnFloor`, `isFillColumn`, `resolveFillColumnKey`, `tableSizing`, `COLUMN_WIDTH_KEY_ATTR` |
| Paginación | `Pagination`, `usePagination`, `DEFAULT_PAGE_SIZE`, `ListFooter` |
| Estado de listado | `useListView` (preferencias + paginación, `paginated: false` y `compactable` opcionales), `useListColumns` (solo columnas), `useListPrefs` |
| Preferencias | `ListPrefs`, `ListSort`, `normalizeListPrefs`, `listPrefsEqual`, `resolveListDefaults`, `LIST_PAGE_SIZES`, `DEFAULT_LIST_PAGE_SIZE`, `EMPTY_LIST_PREFS`, almacenes `useSupabaseListPrefsStore` (hook que sigue la sesión), `createSupabaseListPrefsStore` y `localOnlyListPrefsStore` |
| Versión | `useVersionCheck`, `fetchVersionJson` |
| Auth | `OAuthButtons` (Continuar con Google / Apple), `GoogleIcon`, `AppleIcon`, `getLastAuthMethod`, `setLastAuthMethod`, `DEFAULT_LAST_AUTH_METHOD_KEY`, tipos `AuthMethod`, `OAuthProvider`, `OAuthSignInClient` |
| Utilidades | `safeStorage`, `cn` |

Subrutas:

- `@nscabezon/ui` — todo (módulo de cliente, `"use client"`).
- `@nscabezon/ui/list` — listados y preferencias (cliente).
- `@nscabezon/ui/version` — aviso de versión (cliente).
- `@nscabezon/ui/auth` — login social con Supabase (cliente).
- `@nscabezon/ui/storage` — solo funciones puras (`safeStorage`, `normalizeListPrefs`,
  helpers de columnas, `getLastAuthMethod`, `cn`…), **sin** `"use client"`: se puede importar desde
  un Server Component o un route handler.

Los primitivos shadcn que usan los componentes (button, dropdown-menu, select,
table) van dentro del paquete y no se exportan; usan los tokens CSS de shadcn
(`bg-border`, `text-muted-foreground`, `bg-popover`, `ring-ring`…), que las dos
apps definen.

## Instalación

```bash
npm install "git+https://github.com/NSCabezon/nscabezon-ui.git#v0.2.1"
```

En `package.json` queda así:

```json
"@nscabezon/ui": "git+https://github.com/NSCabezon/nscabezon-ui.git#v0.2.1"
```

Usa la URL `git+https://` (no `github:`): el repo es público y así la
instalación no necesita credenciales. Ojo: si tienes una clave SSH de GitHub
configurada, npm puede reescribir el `resolved` de `package-lock.json` a
`git+ssh://git@github.com/…`. Déjalo en `git+https://github.com/…` (a mano si
hace falta, conservando el `#<commit>`): con https, un CI anónimo (Cloudflare,
GitHub Actions sin claves) instala igual; con `git+ssh` fallaría sin clave.

Peer dependencies (las dos apps ya las tienen): `react` ^19, `react-dom` ^19,
`radix-ui` ^1.5, `lucide-react` >=1, `@tanstack/react-query` ^5, `sonner` ^2 y,
opcional, `@supabase/supabase-js` ^2 (solo si usas el almacén de Supabase; el
paquete no lo importa en tiempo de ejecución, solo usa el cliente que le pasas).

`clsx`, `tailwind-merge` y `class-variance-authority` son dependencias normales:
son pequeñas, sin estado global, y así el paquete no depende de que la app las
tenga (npm las deduplica si los rangos coinciden).

## Tailwind v4: `@source`

Las clases viven en `dist/`, que Tailwind no escanea por defecto (está en
`node_modules`). Añade en el CSS global la ruta **relativa a ese fichero CSS**:

```css
/* Gesmoto: src/index.css */
@source "../node_modules/@nscabezon/ui/dist";

/* TusExámenes: src/app/globals.css */
@source "../../node_modules/@nscabezon/ui/dist";
```

Requisitos del tema: Tailwind ≥ 4.1 (variantes `pointer-coarse:`), los tokens
de shadcn y las utilidades de animación de `tw-animate-css` /
`shadcn/tailwind.css` (`data-open:`, `animate-in`…). Si usas `rowStyle` /
`rowTone` (filas teñidas), define también `--muted-foreground-tinted` en claro y
oscuro: la fila teñida sustituye con él el gris secundario para mantener 4,5:1.

## `UiProvider`

Todo es opcional. Sin provider: los enlaces son `<a>`, la navegación es
`location.assign`, los textos en español y las preferencias solo locales.

```ts
type UiProviderProps = {
  Link?: ComponentType<UiLinkProps>      // { href, className, children, onClick, …<a> }
  navigate?: (href: string) => void      // puede ser una flecha en línea
  labels?: Partial<Labels>               // puede ser un objeto en línea
  listPrefsStore?: ListPrefsStore        // almacén por defecto de useListPrefs
  children: ReactNode
}
```

El valor del contexto es estable: solo cambia cuando cambian `Link`,
`listPrefsStore` o el **contenido** de `labels` (claves y textos). `navigate` y
las etiquetas-función (`count`, `paginationRange`…) se exponen como delegados
estables que llaman siempre a la última versión recibida, así que
`navigate={(href) => router.push(href)}` o un `labels={{ … }}` literal no
re-renderizan los listados en cada render de la app. (Si una etiqueta-función
cambia de comportamiento sin que cambie ningún texto, los componentes
memoizados no se enteran hasta su siguiente render.)

Además hace falta un `QueryClientProvider` de TanStack Query por encima de los
listados (`useListPrefs` usa `useQuery`).

### Next.js (App Router)

```tsx
'use client'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { UiProvider, useSupabaseListPrefsStore } from '@nscabezon/ui'
import { createClient } from '@/lib/supabase/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // createBrowserClient (@supabase/ssr) devuelve un singleton en el navegador:
  // el cliente es estable. Si el tuyo no lo es, memoízalo.
  const store = useSupabaseListPrefsStore(createClient())
  return (
    <UiProvider Link={NextLink} navigate={(href) => router.push(href)} listPrefsStore={store}>
      {children}
    </UiProvider>
  )
}
```

### Vite + react-router

```tsx
import { Link as RouterLink, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { UiProvider, useSupabaseListPrefsStore, type Labels, type UiLinkProps } from '@nscabezon/ui'
import { supabase } from '@/lib/supabase'

function AppLink({ href, ...props }: UiLinkProps) {
  return <RouterLink to={href} {...props} />
}

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const store = useSupabaseListPrefsStore(supabase) // sigue la sesión él solo
  const labels = useMemo<Partial<Labels>>(
    () => ({
      columnsMenu: t('columnsMenu.label'),
      columnsReset: t('columnsMenu.reset'),
      paginationFirst: t('pagination.first'),
      paginationPrev: t('pagination.prev'),
      paginationNext: t('pagination.next'),
      paginationLast: t('pagination.last'),
      paginationRange: (from, to, total) => t('pagination.range', { from, to, total }),
      paginationRangeTruncated: (from, to, total) => t('pagination.rangeTruncated', { from, to, total }),
      count: (count) => t('pagination.count', { count }),
      countTruncated: (count) => t('pagination.countTruncated', { count }),
      pageSizeLabel: t('pagination.pageSizeLabel'),
      pageSizeValue: (count) => t('pagination.pageSizeValue', { count }),
      pageSizeMenu: t('pagination.pageSizeLabel'), // submenú del menú de columnas (v0.7.0)
      columnResize: (column) => t('columnsMenu.resize', { column }), // asa con teclado (v0.9.7)
      noResults: t('list.noResults'),
      loading: t('states.loading'),
      versionMessage: t('versionCheck.message'),
      versionAction: t('versionCheck.action'),
    }),
    [t],
  )
  return (
    <UiProvider Link={AppLink} navigate={navigate} labels={labels} listPrefsStore={store}>
      {children}
    </UiProvider>
  )
}
```

Los textos se resuelven así: `defaultLabels` (español) < `UiProvider.labels` <
prop `labels` del componente (`ResponsiveList`, `ColumnsMenu`, `Pagination`,
`ListFooter`, `useVersionCheck`).

## Listados

```tsx
const columns: ResponsiveColumn<Order>[] = [
  { key: 'number', header: 'Nº', cell: (o) => o.number, primary: true, sortable: true },
  { key: 'client', header: 'Cliente', cell: (o) => o.client, width: 200 },
  { key: 'actions', header: '', cell: (o) => <RowMenu order={o} />, action: true },
]

const view = useListView('orders', {
  columnKeys: columns.map((c) => c.key),
  defaults: { sort: { key: 'number', dir: 'desc' } },
  deps: [search, tab], // vuelven a la página 1 al cambiar
})
// consulta: .order(view.sort.key, …).range(view.from, view.to)
//   con `enabled: view.ready` (v0.8.0): no se consulta con las prefs por defecto

<ResponsiveList columns={columns} data={rows} rowKey={(o) => o.id}
  rowHref={(o) => `/orders/${o.id}`} {...view.listProps} />
<ListFooter {...view.footerProps} columns={columns} total={count} />
```

- `view.ready` (v0.8.0; `view.isLoaded` es su alias): las preferencias ya
  son las definitivas (caché local de ESTE usuario, respuesta del servidor
  —con o sin fila, o error— o sin sesión). Mientras es `false`, `sort`,
  `from` y `to` son los por defecto y **no** deben usarse: pasa
  `enabled: view.ready` a la consulta del listado. `listProps.ready` llega a
  `ResponsiveList`, que con `ready={false}` pinta un esqueleto (`aria-busy`,
  5 barras) en vez de la tabla con anchos, orden y columnas por defecto que
  luego saltarían. Sin la prop, `ready` es `true` (como antes).
- `rowHref` hace la fila entera un enlace: la columna `primary` se envuelve en
  el `Link` del provider (teclado, «abrir en pestaña nueva»), el resto de la
  fila navega con `navigate`, y cmd/ctrl/shift+click o click de rueda abren en
  pestaña nueva.
- Sin paginación (lista entera, orden en cliente):
  `useListView(key, { columnKeys, defaults: {}, paginated: false })` o, solo
  columnas, `useListColumns(key, columnKeys)`.
- Menú de columnas en escritorio (desde v0.6.0): **no es una columna**. El
  botón se superpone en el borde derecho de la cabecera (dentro de la última
  `<th>` visible, que reserva su hueco con `pr-10`; una `action` sin cabecera
  no lo necesita), sin `<col>` ni celdas en el cuerpo, así que no le quita
  ancho a las columnas de datos. **Siempre a la vista aunque la tabla
  scrollee a lo ancho** (LIST-3, v0.9.7): sin `stickyHeader` queda en la
  esquina derecha del envoltorio, fuera del scroll (en el Tab, detrás de las
  cabeceras ordenables); con `stickyHeader` va en un ancla `sticky` (arriba y
  a la derecha, `data-list-columns-menu-sticky`) justo antes de la `<table>`,
  pegada al borde derecho del contenedor de scroll del consumidor y fija con
  la cabecera al bajar (en el Tab, justo antes de las cabeceras). Ni anchos
  ni reparto cambian: solo el envoltorio de la tabla mide lo mismo que ella
  (`min-width` = suma con `resizable`, `min-w-fit` sin él).
- Menú de columnas en móvil (`mobileColumnsMenu`): en móvil no hay cabecera
  de tabla, así que el menú va encima de las tarjetas. Está **activo por
  defecto** en cuanto la lista permite ocultar columnas
  (`onHiddenColumnsChange` + `onColumnsReset`). Regla con `ListFooter`, que ya
  pinta el menú en móvil: `useListView` **paginado** (el que devuelve
  `footerProps`) pone `mobileColumnsMenu: false` en `listProps`, y con
  `paginated: false` o `useListColumns` queda activo. Si montas el pie a mano,
  pasa `mobileColumnsMenu={false}`; si usas `useListView` paginado sin
  `ListFooter`, pásalo a `true` después del spread
  (`{...view.listProps} mobileColumnsMenu`).
- Modo compacto (opt-in): `useListView(key, { …, compactable: true })` añade
  la casilla «Modo compacto» (`labels.compactMode`) al menú de columnas y
  cablea `compact` + `onCompactChange` en `listProps` y `footerProps`;
  `view.compact` dice el modo. Con él, cada fila va en una línea (celdas y
  `<dd>` con elipsis, cabeceras sin envolver, acciones de tarjeta sin saltar)
  y las celdas pueden adaptar su contenido con `useListCompact()`. Se guarda
  en `ListPrefs.compact`; «Restablecer columnas» no lo toca. Sin
  `compactable`, nada cambia.
- Orden de columnas (todos los listados de `useListView` y `useListColumns`):
  `listProps` lleva `columnOrder` + `onColumnOrderChange`. En escritorio se
  arrastra la cabecera para mover la columna (un clic sin mover sigue
  ordenando; el asa de redimensión no arrastra) y el menú de columnas pinta la
  lista en el orden actual con «Subir»/«Bajar» por columna (la vía de
  teclado; textos `labels.columnMoveUp/Down`, funciones con el nombre de la
  columna). Las columnas `action` (y el botón del menú) no se mueven; la `primary`
  puede ir en cualquier posición de la tabla, pero en móvil sigue siendo el
  título de la tarjeta (el `<dl>` sí sigue el orden). `view.order` da el orden
  guardado; `orderColumns(columns, order)` lo aplica en una tabla a mano.
- Filas por página (desde v0.7.0): vive en el **menú de columnas**, como
  submenú «Filas por página» › 10 · 25 · 50 · 100 (`LIST_PAGE_SIZES`, radio
  con el actual marcado), entre «Modo compacto» y «Restablecer columnas».
  `ColumnsMenu` lo pinta solo con `onPageSizeChange` (+ `pageSize`); texto
  `labels.pageSizeMenu` (por defecto «Filas por página»; cada opción es solo
  el número). `useListView` paginado lo cablea en `listProps` (menú de la
  cabecera, escritorio) y en `footerProps` (menú del pie: móvil y lista
  vacía); cambiarlo vuelve a la página 1. Con `paginated: false` no aparece.
  Se navega con teclado (→/Enter/Espacio abre, ↑↓ elige, ← vuelve) y en
  táctil abre con un toque: no hay variante plana para móvil.
  - Regla del pie: `ListFooter` **no** pinta selector de filas cuando tiene
    menú de columnas (`onHiddenChange` + `onReset`, lo normal con
    `useListView`). Sin ellos (pie sin menú de columnas; `hidden`, `columns`,
    `onHiddenChange` y `onReset` son opcionales) el selector se queda en el
    pie como antes. Si montas el `ResponsiveList` a mano con `ListFooter`,
    pásale `pageSize`/`onPageSizeChange` o en escritorio no habrá dónde
    cambiar el tamaño.
  - Pie compacto (v0.7.0): fila con `pt-1` y flechas de `Pagination` de
    28 px (`icon-sm`); en táctil todo sigue a 44 px (`pointer-coarse:`).
  - Recuento estable (v0.8.0): el «N resultados» del pie y el rango de
    `Pagination` van centrados, con `tabular-nums` y un **ancho mínimo fijo**
    (texto sin dígitos + 6 huecos de dígito el recuento, + 12 el rango, en
    `ch`): pasar de 9 a 10 resultados o de página no mueve los botones; solo
    el texto se recentra dentro de su caja. Se prefirió a alinearlo a la
    izquierda para no cambiar la composición del pie.
- Regla de anchos con `resizable` (v0.9.0, «como Excel + relleno»):
  - Arrastrar el borde de una columna cambia **solo esa columna**. Ninguna
    otra se mueve ni encoge, y el único tope es el suelo de la propia columna.
  - Todas las columnas tienen ancho efectivo (`resolveColumnWidth`): el
    guardado en `columnWidths`, si no su `width`, si no
    `DEFAULT_COLUMN_WIDTH` (160 px; las `action` sin cabecera,
    `DEFAULT_ACTION_COLUMN_WIDTH`, 56 px).
  - La tabla mide **máx(ancho del contenedor, suma de anchos)**. Si la suma
    no cabe, scroll horizontal (el contenedor de la tabla, o el contenedor de
    scroll del consumidor con `stickyHeader`).
  - Columna de **relleno**: una por tabla, marcada con `fill: true` (si hay
    varias, la primera). Si sobra sitio, se estira para ocuparlo; nunca baja
    de su ancho base (su `width`/guardado/160), que es el que cuenta en la
    suma. **Sin ninguna marcada no hay relleno**: queda hueco a la derecha.
    No se elige sola: márcala en la columna de texto principal (descripción,
    cliente…), nunca en un Nº. `flex: true` (v0.5.0) sigue valiendo como
    alias deprecado.
  - Relleno dimensionado a mano (v0.9.3): en cuanto el usuario arrastra la
    columna de relleno deja de rellenar y manda su ancho guardado (se puede
    estrechar); la tabla queda **sin relleno** (hueco a la derecha) y el
    relleno no pasa a otra columna `fill`. Doble clic en su asa o
    «Restablecer columnas» la devuelven a relleno
    (`resolveFillColumnKey(columns, widths)`).
  - Relleno con **tope** (v0.9.8, LIST-6): el ancho guardado del relleno es
    «como mucho X». Al arrastrarlo, el borde sigue al ratón desde su ancho
    pintado y al soltar se guarda ese ancho. En pantallas mayores se ve a X y
    el sobrante va al resto en proporción; en menores encoge hasta lo que
    quepa, nunca por debajo de su base. Doble clic / Escape / Supr lo quitan.
    Necesita el ancho del contenedor (`ResponsiveList` lo mide; tablas a mano:
    `useColumnResize({ containerWidth })`).
  - Con reparto proporcional el borde sigue al ratón (v0.9.8, UI-9): se
    resuelve la base que deja el borde bajo el puntero; el teclado mueve
    16/64 px en pantalla.
  - Suelo (`columnFloor`): `minWidth` de la columna o `MIN_COLUMN_WIDTH`
    (64 px; menos si su propio ancho por defecto es menor, p. ej. un icono).
    Un ancho guardado por debajo se pinta al suelo.
  - Al estrechar la ventana no cambia nada salvo que el relleno pierde su
    estiramiento; si no cabe, scroll. Doble clic en el asa y «Restablecer
    columnas» devuelven los anchos de serie. La última columna no lleva asa
    propia.
  - Teclado (v0.9.7, LIST-4): el asa de cada columna es un
    `role="separator"` enfocable (`tabIndex=0`, en el Tab justo detrás del
    botón de ordenar de su cabecera), con `aria-orientation="vertical"`,
    `aria-label` = `labels.columnResize(columna)` (por defecto «Ajustar ancho
    de {columna}») y `aria-valuenow/min/max` en px. **←/→** cambian 16 px
    (1 rem; `RESIZE_KEY_STEP`), **Mayús+←/→** 64 px
    (`RESIZE_KEY_STEP_LARGE`), con el mismo suelo que el ratón y techo de
    teclado `RESIZE_KEY_MAX` (1600). Se ve en vivo y se guarda al soltar la
    tecla (o al salir del asa), por el mismo `onColumnWidthsChange` que el
    arrastre. **Escape, Supr o Retroceso** devuelven el ancho de serie (como
    el doble clic). Las teclas no ordenan ni mueven la columna. La mitad
    `start` de la zona de agarre no es enfocable.
  - Zona de agarre (v0.9.3): centrada en la línea. El asa de cada columna
    (`data-column-resize-handle=""`, borde derecho de su `<th>`) más la otra
    mitad en el borde izquierdo de la `<th>` siguiente
    (`data-column-resize-handle="start"`, `resizeHandle(prevKey, 'start')`),
    que redimensiona la anterior. Fallar el asa por 1 px ya no agarra la
    cabecera vecina (que se arrastra para reordenar). En una tabla a mano,
    pon las dos para el mismo efecto.
  - Técnica (`tableSizing`): `table-fixed` + `<colgroup>` con el ancho de
    cada columna en px. Con relleno, su `<col>` va **sin** ancho y la tabla
    lleva `width: 100%; min-width: <suma>px`: table-fixed da al relleno todo
    lo que sobra (tabla − resto), que nunca es menor que su base porque la
    tabla no baja de la suma. Sin relleno, `width: <suma>px` exacta (con
    `100%`, table-fixed repartiría el sobrante entre todas).
  - Tabla a mano: `useColumnResize({ columnWidths, onColumnWidthsChange,
    columns })` con las columnas visibles en orden; `colWidth(key)` en cada
    `<col>`, `tableStyle(extraPx)` en la `<table>` (con `table-fixed`) y
    `data-column-width-key={key}` en cada `<th>`. Devuelve también
    `fillKey` y `totalWidth`. Sin `columns`, el hook se comporta como antes
    (cambia la arrastrada, sin estilo de tabla).
- Fondo de la cabecera y del botón del menú de columnas (v0.9.0): el botón no
  tiene color propio (`bg-inherit`, igual que `<th>`, `<tr>` y `<thead>`), así
  que toma el fondo real de su cabecera: el `bg-*` de `headClassName`, el de
  la tarjeta… y si la cabecera es transparente, él también. La cabecera fija
  (`stickyHeader`) sí es opaca: `var(--list-head-bg)` si la fijas (en el
  `className` de la lista o un ancestro, p. ej.
  `[--list-head-bg:var(--color-muted)]`); si no, `--color-card` dentro de un
  `.bg-card` (automático); si no, `--color-background`.

## Preferencias de listado

```ts
useListPrefs(listKey, { columnKeys, defaults?, store? }): {
  prefs: ListPrefs            // { hidden, widths, sort, pageSize, compact, order }
  setHidden, setWidths, setSort, setPageSize, setCompact, setOrder, reset, isLoaded
}
```

- Caché local en `localStorage` (vía `safeStorage`), leída con
  `useSyncExternalStore`: en Next el render de servidor y la hidratación usan
  los defaults y justo después se aplica la caché (sin error de hidratación);
  en una SPA el primer render ya la lee. Clave según `store.userId`
  (v0.8.0, `listPrefsStorageKey(userId, listKey)`):
  - usuario (`string`): `list-prefs:<userId>:<listKey>`. En un PC compartido
    cada usuario pinta con lo suyo. Al cambiar de usuario en la misma pestaña
    se vacía la caché en memoria.
  - sin sesión (`null`): `list-prefs:<listKey>` (la de siempre, del dispositivo).
  - desconocido (`undefined`, sesión resolviéndose): ninguna; defaults e
    `isLoaded = false`.
- Migración de la clave vieja (`list-prefs:<listKey>`, < v0.8.0): con usuario
  **no** se usa para pintar ni se sube a su cuenta (pudo dejarla otro
  usuario); se borra cuando el servidor responde. Ese primer arranque de cada
  lista espera al servidor (una vez).
- `isLoaded` (v0.8.0): `true` solo si hay caché local de ESTE usuario para
  esta lista, si la consulta al servidor terminó (con fila, sin fila o con
  error) o si no hay sesión (`userId === null`). Antes era `true` con usuario
  aún desconocido.
- Remoto: la fila del almacén gana (una vez por usuario y lista); si no hay
  fila y la caché difiere del defecto, se sube la local.
- Ocultas, orden, orden de columnas, tamaño de página y compacto se guardan al instante; los anchos con
  debounce de 400 ms y flush al desmontar.
- Todo se normaliza contra las columnas de hoy: claves desconocidas fuera,
  tamaño de página solo 10/25/50/100, compacto solo booleano (si no, `false`),
  orden de columnas sin desconocidas ni repetidas y con las que falten
  (columnas nuevas) añadidas al final (`[]` = orden de serie).
- `reset()` devuelve ocultas, anchos y orden de columnas a los **defaults del
  listado** (`defaults.hidden`, `defaults.widths` o `{}`, `defaults.order` o
  `[]`): una columna oculta de serie vuelve a ocultarse. Conserva orden de
  filas, tamaño de página y compacto.

### Almacén de Supabase

Tabla (la misma en Gesmoto y TusExámenes):

```sql
create table public.user_list_prefs (
  user_id uuid not null references auth.users on delete cascade,
  list_key text not null,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, list_key),
  constraint user_list_prefs_list_key_format check (list_key ~ '^[a-z0-9-]{1,64}$')
);
-- RLS: cada usuario solo lee/escribe sus filas.
```

```ts
// Hook: sigue la sesión (getSession al montar + onAuthStateChange, con baja al
// desmontar). userId undefined mientras getSession no responde (las listas
// esperan), null sin sesión (o si getSession falla). Memoizado por cliente +
// usuario + tabla.
const store = useSupabaseListPrefsStore(supabase)
// opciones: { table?: string; onError?: (e) => void }  (onError puede ir en línea)

// Sin React, o si ya tienes el userId: la factoría de siempre. OJO: trata
// `undefined` como «sin sesión» (null); si tu userId aún se resuelve, pasa
// `{ ...store, userId: undefined }` para que las listas esperen.
const store = useMemo(() => createSupabaseListPrefsStore(supabase, userId), [userId])
```

`useSupabaseListPrefsStore` pide un cliente con `.from()` y
`auth.getSession` / `auth.onAuthStateChange` (tipado a mano,
`SupabaseLikeAuthClient`: no importa `@supabase/supabase-js` ni necesita
TanStack Query). Pásale un cliente estable.

Un almacén propio solo tiene que cumplir:

```ts
type ListPrefsStore = {
  userId: string | null | undefined   // undefined = aún desconocido (v0.8.0)
  load(listKey: string): Promise<unknown | null>   // fila sin normalizar o null
  save(listKey: string, prefs: ListPrefs): Promise<void>
}
```

## Aviso de versión nueva

```ts
useVersionCheck({
  fetchVersion: () => fetchVersionJson('/version.json'), // o '/api/version'
  currentVersion: __APP_VERSION__,                       // o process.env.NEXT_PUBLIC_BUILD_ID!
  enabled: import.meta.env.PROD,                         // o process.env.NODE_ENV === 'production'
})
```

Comprueba al montar, cada 5 min y al recuperar foco/visibilidad (máx. una vez
por minuto). Avisa una vez por versión con un toast persistente de sonner
(`top-center`) con acción «Actualizar» (`location.reload()`, o `onReload`).
`fetchVersion`, `currentVersion` y los textos se leen de un ref: cambiar su
identidad no reinicia el intervalo.

## Login social

```tsx
'use client'
import { OAuthButtons, getLastAuthMethod } from '@nscabezon/ui/auth'
import { createClient } from '@/lib/supabase/client'

<OAuthButtons
  client={createClient()}
  redirectTo={() => `${window.location.origin}/auth/callback`}
  lastMethod={getLastAuthMethod()}
/>
```

Pinta el separador «o continúa con» y un botón por proveedor (`providers`,
por defecto Google y Apple). Al pulsar deshabilita los botones, guarda el
proveedor con `setLastAuthMethod` (`rememberLastMethod`: `false` o
`{ storageKey }` para cambiarlo), llama a `onBeforeRedirect` (p. ej. guardar
un deep-link en `sessionStorage`) y a `client.auth.signInWithOAuth`. Si falla
antes de redirigir, `onError` (por defecto `toast.error` de sonner) y los
botones vuelven a estar activos. `redirectTo` acepta una función para leer
`window` solo al hacer click (SSR). `providerOptions` añade `scopes` /
`queryParams` por proveedor. Textos en `Labels`: `oauthDivider`,
`oauthGoogle`, `oauthApple`, `lastUsed`.

El callback (`/auth/callback`, intercambio del código por sesión), las rutas
post-login y la configuración de los proveedores en Supabase (client IDs,
allow-list de URLs de vuelta) son de cada app.

## Desarrollo

```bash
npm install
npm test            # vitest (jsdom)
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/
npm run verify      # typecheck + test + build + dist/ sin cambios pendientes (git status)
```

`verify` falla si `dist/` no está al día con el código: hay que commitear el
`dist/` regenerado.

## Publicar una versión

1. Cambios + tests.
2. Sube la versión en `package.json` (semver: `0.1.1`, `0.2.0`…).
3. `npm run build` y `npm run verify`.
4. Entrada en `CHANGELOG.md`.
5. Commit **incluyendo `dist/`**: `git commit -am "release: vX.Y.Z"`.
6. `git tag -a vX.Y.Z -m "vX.Y.Z"` y `git push origin main --follow-tags`.
7. En cada app: cambia el tag en `package.json`
   (`"@nscabezon/ui": "git+https://github.com/NSCabezon/nscabezon-ui.git#vX.Y.Z"`),
   `npm install` y comprueba que el `resolved` del lock sigue en `git+https`.

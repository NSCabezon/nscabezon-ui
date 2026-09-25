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
| Listados | `ResponsiveList` (tabla en escritorio / tarjetas en móvil, orden servidor, anchos arrastrables, columnas ocultas, cabecera fija, filas teñidas, `rowHref`), `ColumnsMenu`, `useColumnResize`, `MIN_COLUMN_WIDTH`, `TOUCH_TEXT_LINK`, `rowTone`, `TINTED_ROW_CLASS`, `resolveColumnWidth`, `visibleColumnsOf`, `DEFAULT_ACTION_COLUMN_WIDTH` |
| Paginación | `Pagination`, `usePagination`, `DEFAULT_PAGE_SIZE`, `ListFooter` |
| Estado de listado | `useListView` (preferencias + paginación, `paginated: false` opcional), `useListColumns` (solo columnas), `useListPrefs` |
| Preferencias | `ListPrefs`, `ListSort`, `normalizeListPrefs`, `listPrefsEqual`, `resolveListDefaults`, `LIST_PAGE_SIZES`, `DEFAULT_LIST_PAGE_SIZE`, `EMPTY_LIST_PREFS`, almacenes `createSupabaseListPrefsStore` y `localOnlyListPrefsStore` |
| Versión | `useVersionCheck`, `fetchVersionJson` |
| Utilidades | `safeStorage`, `cn` |

Subrutas:

- `@nscabezon/ui` — todo (módulo de cliente, `"use client"`).
- `@nscabezon/ui/list` — listados y preferencias (cliente).
- `@nscabezon/ui/version` — aviso de versión (cliente).
- `@nscabezon/ui/storage` — solo funciones puras (`safeStorage`, `normalizeListPrefs`,
  helpers de columnas, `cn`…), **sin** `"use client"`: se puede importar desde
  un Server Component o un route handler.

Los primitivos shadcn que usan los componentes (button, dropdown-menu, select,
table) van dentro del paquete y no se exportan; usan los tokens CSS de shadcn
(`bg-border`, `text-muted-foreground`, `bg-popover`, `ring-ring`…), que las dos
apps definen.

## Instalación

```bash
npm install "github:NSCabezon/nscabezon-ui#v0.1.0"
```

En `package.json` queda así:

```json
"@nscabezon/ui": "github:NSCabezon/nscabezon-ui#v0.1.0"
```

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
  navigate?: (href: string) => void
  labels?: Partial<Labels>               // memoízalo si lo construyes en el render
  listPrefsStore?: ListPrefsStore        // almacén por defecto de useListPrefs
  children: ReactNode
}
```

Además hace falta un `QueryClientProvider` de TanStack Query por encima de los
listados (`useListPrefs` usa `useQuery`).

### Next.js (App Router)

```tsx
'use client'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { UiProvider, createSupabaseListPrefsStore } from '@nscabezon/ui'
import { createClient } from '@/lib/supabase/client'

export function Providers({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const router = useRouter()
  const store = useMemo(() => createSupabaseListPrefsStore(createClient(), userId), [userId])
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
import { UiProvider, createSupabaseListPrefsStore, type Labels, type UiLinkProps } from '@nscabezon/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

function AppLink({ href, ...props }: UiLinkProps) {
  return <RouterLink to={href} {...props} />
}

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const store = useMemo(() => createSupabaseListPrefsStore(supabase, userId), [userId])
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

<ResponsiveList columns={columns} data={rows} rowKey={(o) => o.id}
  rowHref={(o) => `/orders/${o.id}`} {...view.listProps} />
<ListFooter {...view.footerProps} columns={columns} total={count} />
```

- `rowHref` hace la fila entera un enlace: la columna `primary` se envuelve en
  el `Link` del provider (teclado, «abrir en pestaña nueva»), el resto de la
  fila navega con `navigate`, y cmd/ctrl/shift+click o click de rueda abren en
  pestaña nueva.
- Sin paginación (lista entera, orden en cliente):
  `useListView(key, { columnKeys, defaults: {}, paginated: false })` o, solo
  columnas, `useListColumns(key, columnKeys)`. Sin `ListFooter`, pasa
  `mobileColumnsMenu` a `ResponsiveList` para que el menú de columnas salga
  encima de las tarjetas en móvil.
- Regla de anchos con `resizable`: como mucho UNA columna (lo normal, la
  `primary`) sin `width`; una `action` con botón de texto necesita `width` o
  `header` (sin ellos cae a 56 px).

## Preferencias de listado

```ts
useListPrefs(listKey, { columnKeys, defaults?, store? }): {
  prefs: ListPrefs            // { hidden, widths, sort, pageSize }
  setHidden, setWidths, setSort, setPageSize, reset, isLoaded
}
```

- Caché local en `localStorage` (`list-prefs:<listKey>`, vía `safeStorage`),
  leída con `useSyncExternalStore`: en Next el render de servidor y la
  hidratación usan los defaults y justo después se aplica la caché (sin error
  de hidratación); en una SPA el primer render ya la lee.
- Remoto: la fila del almacén gana (una vez por usuario y lista); si no hay
  fila y la caché difiere del defecto, se sube la local.
- Ocultas, orden y tamaño de página se guardan al instante; los anchos con
  debounce de 400 ms y flush al desmontar.
- Todo se normaliza contra las columnas de hoy: claves desconocidas fuera,
  tamaño de página solo 10/25/50.
- `reset()` limpia ocultas y anchos; conserva orden y tamaño de página.

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
const store = useMemo(() => createSupabaseListPrefsStore(supabase, userId), [userId])
// opciones: { table?: string; onError?: (e) => void }
```

Un almacén propio solo tiene que cumplir:

```ts
type ListPrefsStore = {
  userId: string | null
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
4. Commit **incluyendo `dist/`**: `git commit -am "release: vX.Y.Z"`.
5. `git tag -a vX.Y.Z -m "vX.Y.Z"` y `git push origin main --tags`.
6. En cada app: cambia el tag en `package.json`
   (`"@nscabezon/ui": "github:NSCabezon/nscabezon-ui#vX.Y.Z"`) y
   `npm install`.

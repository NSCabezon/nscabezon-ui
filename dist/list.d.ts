import * as React from 'react';
import { CSSProperties } from 'react';
import { g as ListSort, b as Labels, d as ListPrefs, e as ListPrefsDefaults, f as ListPrefsStore, h as SupabaseLikeClient, i as SupabaseListPrefsStoreOptions } from './UiProvider-COtezHWe.js';
export { D as DEFAULT_LIST_PAGE_SIZE, E as EMPTY_LIST_PREFS, L as LIST_PAGE_SIZES, a as LIST_PREFS_STORAGE_PREFIX, c as ListPageSize, S as SortDir, m as createSupabaseListPrefsStore, o as isListPageSize, p as listPrefsEqual, q as localOnlyListPrefsStore, r as normalizeListPrefs, s as resolveListDefaults } from './UiProvider-COtezHWe.js';

type ResponsiveColumn<T> = {
    key: string;
    header?: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    primary?: boolean;
    action?: boolean;
    hideOnMobile?: boolean;
    mobileFullWidth?: boolean;
    mobileHideLabel?: boolean;
    mobileHideWhen?: (row: T) => boolean;
    noRowLink?: boolean;
    sortable?: boolean;
    headClassName?: string;
    cellClassName?: string;
    width?: number;
    fill?: boolean;
    flex?: boolean;
    minWidth?: number;
};
type ResponsiveListProps<T> = {
    columns: ResponsiveColumn<T>[];
    data: T[];
    rowKey: (row: T) => React.Key;
    rowHref?: (row: T) => string | undefined;
    onRowClick?: (row: T) => void;
    rowHoverProps?: (row: T) => {
        onMouseEnter?: React.MouseEventHandler<HTMLElement>;
        onMouseLeave?: React.MouseEventHandler<HTMLElement>;
    };
    leading?: (row: T) => React.ReactNode;
    isRowSelected?: (row: T) => boolean;
    rowClassName?: (row: T) => string | undefined;
    rowStyle?: (row: T) => React.CSSProperties | undefined;
    sort?: ListSort | null;
    onSortChange?: (next: ListSort) => void;
    resizable?: boolean;
    columnWidths?: Record<string, number>;
    onColumnWidthsChange?: (widths: Record<string, number>) => void;
    hiddenColumns?: string[];
    onHiddenColumnsChange?: (hidden: string[]) => void;
    onColumnsReset?: () => void;
    mobileColumnsMenu?: boolean;
    compact?: boolean;
    onCompactChange?: (compact: boolean) => void;
    columnOrder?: string[];
    onColumnOrderChange?: (order: string[]) => void;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    stickyHeader?: boolean;
    stickyHeaderTop?: number;
    ready?: boolean;
    className?: string;
    labels?: Partial<Labels>;
};
declare const TOUCH_TEXT_LINK = "pointer-coarse:-my-3 pointer-coarse:min-h-11 pointer-coarse:py-3 pointer-coarse:-mx-3 pointer-coarse:min-w-11 pointer-coarse:px-3";
declare function ResponsiveList<T>({ columns, data, rowKey, rowHref, onRowClick, rowHoverProps, leading, isRowSelected, rowClassName, rowStyle, sort, onSortChange, resizable, columnWidths, onColumnWidthsChange, hiddenColumns, onHiddenColumnsChange, onColumnsReset, mobileColumnsMenu, compact, onCompactChange, columnOrder, onColumnOrderChange, pageSize, onPageSizeChange, stickyHeader, stickyHeaderTop, ready, className, labels: labelsProp, }: ResponsiveListProps<T>): React.JSX.Element;

type ColumnsMenuColumn = {
    key: string;
    header?: React.ReactNode;
    primary?: boolean;
    action?: boolean;
};
type ColumnsMenuProps = {
    columns: ColumnsMenuColumn[];
    hidden: string[];
    onHiddenChange: (hidden: string[]) => void;
    onReset: () => void;
    className?: string;
    /**
     * Modo compacto (opt-in): con `onCompactChange`, el menú pinta la casilla
     * «Modo compacto» encima de «Restablecer columnas». Sin él, nada cambia.
     */
    compact?: boolean;
    onCompactChange?: (compact: boolean) => void;
    /**
     * Orden de columnas (opt-in): el menú lista las columnas en `columnOrder`
     * (ver `orderColumns`) y, con `onColumnOrderChange`, cada columna no-`action`
     * lleva «Subir»/«Bajar» (deshabilitados en los extremos, sin cerrar el menú).
     * El callback recibe todas las claves de `columns` en el orden nuevo.
     */
    columnOrder?: string[];
    onColumnOrderChange?: (order: string[]) => void;
    /**
     * Filas por página (opt-in, v0.7.0): con `onPageSizeChange`, el menú pinta
     * el submenú «Filas por página» › 10 · 25 · 50 · 100 (`LIST_PAGE_SIZES`,
     * radio con `pageSize` marcado) entre «Modo compacto» y «Restablecer
     * columnas». Sin él, nada cambia. Elegir un tamaño cierra el menú.
     */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Textos propios; ganan al `UiProvider`. */
    labels?: Partial<Pick<Labels, 'columnsMenu' | 'columnsReset' | 'compactMode' | 'columnMoveUp' | 'columnMoveDown' | 'pageSizeMenu'>>;
};
declare function ColumnsMenu({ columns, hidden, onHiddenChange, onReset, className, compact, onCompactChange, columnOrder, onColumnOrderChange, pageSize, onPageSizeChange, labels: labelsProp, }: ColumnsMenuProps): React.JSX.Element;

/** `true` dentro de un `ResponsiveList` en modo compacto; `false` fuera o en modo normal. */
declare function useListCompact(): boolean;

declare const DEFAULT_ACTION_COLUMN_WIDTH = 56;
/**
 * Ancho por defecto (px) de una columna de un listado `resizable` que no trae
 * `width` ni ancho guardado (v0.9.0). Desde el modelo «como Excel» TODAS las
 * columnas tienen ancho efectivo; la de relleno usa este como base y se estira
 * encima.
 */
declare const DEFAULT_COLUMN_WIDTH = 160;
/** Suelo por defecto (px) de una columna redimensionable, si no trae `minWidth`. */
declare const MIN_COLUMN_WIDTH = 64;
/** Lo que las reglas de anchos necesitan saber de cada columna. */
type SizedColumn = {
    key: string;
    width?: number;
    action?: boolean;
    header?: unknown;
    primary?: boolean;
    /** Columna de relleno (v0.9.0): se estira para ocupar el hueco que sobre. */
    fill?: boolean;
    /** @deprecated v0.9.0: alias de `fill`. */
    flex?: boolean;
    minWidth?: number;
};
/** ¿Es la columna de relleno? `fill`, o el alias deprecado `flex` (v0.5.0). */
declare function isFillColumn(col: {
    fill?: boolean;
    flex?: boolean;
}): boolean;
/**
 * Columna de relleno de un listado `resizable`: la PRIMERA marcada con `fill`
 * (o `flex`) entre las visibles. Sin ninguna marcada, `undefined`: NO hay
 * relleno y, si las columnas no llegan al ancho del contenedor, queda hueco a
 * la derecha. Nunca se elige sola (ni la `primary`): la decide el consumidor.
 */
declare function resolveFillColumnKey(columns: SizedColumn[]): string | undefined;
/**
 * Suelo de una columna: su `minWidth` si lo trae; si no, `MIN_COLUMN_WIDTH`
 * (64), salvo que su propio ancho por defecto sea menor (un icono de 40 o 56
 * px no se infla a 64 por defecto).
 */
declare function columnFloor(col: Omit<SizedColumn, 'key'>): number;
/**
 * Ancho efectivo (px) de una columna de un ResponsiveList `resizable`: lo
 * guardado/arrastrado gana; si no hay, su `width`; si tampoco, el ancho
 * compacto de una `action` SIN cabecera (icono suelto) o `DEFAULT_COLUMN_WIDTH`.
 * Nunca baja de `columnFloor`: un ancho guardado por debajo del suelo (p. ej.
 * una fecha guardada a 105 px que corta «19/10/2…») se pinta al suelo.
 *
 * En la columna de relleno es su ancho BASE: el que tiene cuando la tabla no
 * cabe; si sobra sitio, se estira por encima (ver `tableSizing`).
 */
declare function resolveColumnWidth(col: Omit<SizedColumn, 'key'>, stored: number | undefined): number;
/**
 * Estilo de la `<table>` (table-fixed) para el modelo «como Excel + relleno»:
 * - Con columna de relleno: `width: 100%` y `min-width: suma`. La `<col>` del
 *   relleno va SIN ancho, así que table-fixed le da todo lo que sobre
 *   (tabla − resto de columnas); como la tabla nunca baja de la suma, ese
 *   sobrante nunca es menor que su base. Resultado: ancho = máx(contenedor,
 *   suma), el relleno solo crece y el resto no se mueve.
 * - Sin relleno: `width: suma` exacta. Con `width: 100%` table-fixed
 *   repartiría el sobrante entre TODAS las columnas; con la suma, queda hueco
 *   a la derecha.
 * Si la suma supera el contenedor, la tabla lo desborda y el contenedor de
 * scroll la desplaza a lo ancho.
 */
declare function tableSizing(totalWidth: number, hasFill: boolean): {
    width: string | number;
    minWidth?: number;
};
/**
 * Columnas visibles: las ocultas por el usuario fuera, salvo la `primary`,
 * que nunca se oculta. Sin ocultas devuelve el mismo array.
 */
declare function visibleColumnsOf<C extends {
    key: string;
    primary?: boolean;
}>(columns: C[], hidden: string[] | undefined): C[];

/** Atributo que marca cada `<th>` medible con la clave de su columna. */
declare const COLUMN_WIDTH_KEY_ATTR = "data-column-width-key";
/**
 * Columnas redimensionables con el ratón: asa en el borde derecho de cada
 * cabecera, doble clic para devolverla a su ancho natural.
 *
 * Vive aparte de `ResponsiveList` porque también lo usan tablas a mano (p. ej.
 * una tabla de líneas con celdas editables). Los anchos se persisten con
 * `useListPrefs` (`setWidths`).
 *
 * Mecánica: pointer events CON captura, así el arrastre sigue aunque el puntero
 * salga de la celda. Mientras se arrastra el ancho vive en el estado local
 * (`drag`) y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Modelo «como Excel + relleno» (v0.9.0, con `columns`):
 * - Arrastrar el borde cambia SOLO esa columna; ninguna otra se mueve ni
 *   encoge, y no hay más tope que el suelo de la propia columna
 *   (`columnFloor`: su `minWidth` o 64 px).
 * - Todas las columnas tienen ancho efectivo (`resolveColumnWidth`): guardado,
 *   `width` o `DEFAULT_COLUMN_WIDTH`. `totalWidth` es su suma.
 * - La de relleno (`fill: true`, alias `flex`) tiene un ancho BASE como las
 *   demás (cuenta en la suma y se guarda al arrastrarla) y se estira encima
 *   si sobra sitio: su `<col>` va sin ancho (`colWidth` → `undefined`) y la
 *   tabla lleva `tableStyle` (`tableSizing`). Sin relleno, hueco a la derecha.
 *   Al arrastrar la de relleno se parte de su ancho PINTADO (medido del
 *   `<th>`, estiramiento incluido), para que el asa siga al puntero.
 * Sin `columns` (tablas a mano antiguas): cambia la arrastrada, partiendo del
 * ancho guardado o, si no hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 */
declare function useColumnResize({ columnWidths, onColumnWidthsChange, columns, }: {
    columnWidths?: Record<string, number>;
    onColumnWidthsChange?: (widths: Record<string, number>) => void;
    /** Columnas VISIBLES, en orden: activa el modelo «como Excel + relleno». */
    columns?: SizedColumn[];
}): {
    widthOf: (key: string) => number | undefined;
    colWidth: (key: string) => number | undefined;
    fillKey: string | undefined;
    /** @deprecated v0.9.0: usa `fillKey`. */
    flexKey: string | undefined;
    totalWidth: number | undefined;
    tableStyle: (extra?: number) => React.CSSProperties | undefined;
    resizeHandle: (columnKey: string) => React.JSX.Element;
};

type OrderableColumn = {
    key: string;
    action?: boolean;
};
/** `columns` en el orden guardado (ver reglas arriba). */
declare function orderColumns<C extends OrderableColumn>(columns: C[], order: readonly string[] | undefined): C[];
/**
 * Nuevo orden (todas las claves de `columns`, en el orden resultante) tras
 * mover `from` a la posición de `to`: si `from` estaba antes, queda detrás de
 * `to`; si estaba después, delante. Las `action` no se mueven ni son destino:
 * en ese caso devuelve `null` (nada que guardar).
 */
declare function moveColumn<C extends OrderableColumn>(columns: C[], order: readonly string[] | undefined, from: string, to: string): string[] | null;

/**
 * Clases de una fila con `rowStyle` en `ResponsiveList` (tabla y tarjeta).
 *
 * A11Y-2 (auditoría 23/09): el tinte oscurece (claro) o aclara (oscuro) el
 * fondo, y el texto secundario (`text-muted-foreground`: vehículo, referencia,
 * «••••••», fechas) bajaba a 3,56–4,27:1. La fila redefine `--muted-foreground`
 * con `--muted-foreground-tinted`, un gris que aguanta 4,5:1 incluso con el
 * tinte del hover y el color de estado más oscuro; como el tema declara el
 * color con `@theme inline`, `text-muted-foreground` lee la variable de la
 * propia fila. La app debe definir `--muted-foreground-tinted` en su tema
 * (claro y oscuro) si usa `rowStyle`.
 */
declare const TINTED_ROW_CLASS = "bg-(--row-tint) hover:bg-(--row-tint-hover) shadow-[inset_3px_0_0_var(--row-accent)] [--muted-foreground:var(--muted-foreground-tinted)]";
/**
 * Estilo de «fila coloreada» de `ResponsiveList` (`rowStyle`) a partir de un
 * color CSS (hex de la etapa, `var(--muted-foreground)`, …). Devuelve las tres
 * variables que la lista espera: `--row-accent` (franja), `--row-tint` (fondo)
 * y `--row-tint-hover`. El texto de la fila no cambia de color.
 *
 * Regla: se tiñe solo la fila que tiene un estado; un listado sin estado no
 * usa `rowStyle`.
 */
declare function rowTone(color: string): CSSProperties;

type PaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    truncated?: boolean;
    className?: string;
    /** Textos propios; ganan al `UiProvider`. */
    labels?: Partial<Labels>;
};
declare function Pagination({ page, pageSize, total, onPageChange, truncated, className, labels: labelsProp, }: PaginationProps): React.JSX.Element | null;

declare const DEFAULT_PAGE_SIZE: number;
declare function usePagination(deps?: unknown[], pageSize?: number): {
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number;
    from: number;
    to: number;
};

type ListViewDefaults = ListPrefsDefaults;
type UseListViewOptions = {
    columnKeys: readonly string[];
    defaults: ListViewDefaults;
    deps?: unknown[];
    paginated?: boolean;
    stickyHeader?: boolean;
    store?: ListPrefsStore;
    compactable?: boolean;
};
type ListViewListProps = {
    sort: ListSort | null;
    onSortChange: (next: ListSort) => void;
    resizable: true;
    columnWidths: Record<string, number>;
    onColumnWidthsChange: (widths: Record<string, number>) => void;
    hiddenColumns: string[];
    onHiddenColumnsChange: (hidden: string[]) => void;
    onColumnsReset: () => void;
    mobileColumnsMenu: boolean;
    stickyHeader: boolean;
    compact?: boolean;
    onCompactChange?: (compact: boolean) => void;
    columnOrder: string[];
    onColumnOrderChange: (order: string[]) => void;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    ready: boolean;
};
type ListViewFooterProps = {
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    hidden: string[];
    onHiddenChange: (hidden: string[]) => void;
    onReset: () => void;
    compact?: boolean;
    onCompactChange?: (compact: boolean) => void;
    columnOrder?: string[];
    onColumnOrderChange?: (order: string[]) => void;
};
type ListViewBase = {
    prefs: ListPrefs;
    sort: ListSort | null;
    listProps: ListViewListProps;
    /**
     * v0.8.0: las preferencias (orden, columnas, anchos, compacto, filas por
     * página) ya son las definitivas: caché local de ESTE usuario, respuesta del
     * servidor o sin sesión. Mientras es `false`, `sort`/`from`/`to` son los
     * por defecto y NO deben usarse para consultar: pasa `enabled: view.ready`
     * a la consulta del listado (así no se pide una página con el orden o el
     * tamaño equivocados que luego cambia).
     */
    ready: boolean;
    /** Alias de `ready` (nombre anterior a v0.8.0). */
    isLoaded: boolean;
    /** Modo compacto vigente (`false` si el listado no es `compactable`). */
    compact: boolean;
    /** Orden de columnas guardado (`[]` = el de serie). Ver `orderColumns`. */
    order: string[];
};
type ListView = ListViewBase & {
    pageSize: number;
    page: number;
    setPage: (page: number) => void;
    /** Índice inicial (0-based, inclusive) para `.range(from, to)`. */
    from: number;
    /** Índice final (0-based, inclusive) para `.range(from, to)`. */
    to: number;
    footerProps: ListViewFooterProps;
};
type UnpaginatedListView = ListViewBase;

/**
 * Estado completo de un listado estándar: preferencias por usuario (orden,
 * anchos, columnas ocultas, orden de columnas, tamaño de página y, con `compactable`, modo
 * compacto — `useListPrefs`) + paginación
 * (`usePagination`) ya cableadas entre sí. Devuelve dos paquetes de props
 * listos para hacer spread: `listProps` → `ResponsiveList` (incluido el menú
 * de columnas de la cabecera) y `footerProps` → `ListFooter`; y lo que la
 * consulta necesita: `sort`, `from`, `to` y `ready` (`enabled: view.ready`).
 *
 * Cambiar el orden, el tamaño de página o cualquiera de las `deps` vuelve a la
 * página 1. `listKey` es la clave de `user_list_prefs` (kebab-case, única por
 * listado).
 */
declare function useListView(listKey: string, options: UseListViewOptions & {
    paginated: false;
}): UnpaginatedListView;
declare function useListView(listKey: string, options: UseListViewOptions & {
    paginated?: true;
}): ListView;

type ListFooterProps = Omit<ListViewFooterProps, 'hidden' | 'onHiddenChange' | 'onReset'> & Partial<Pick<ListViewFooterProps, 'hidden' | 'onHiddenChange' | 'onReset'>> & {
    total: number;
    columns?: ColumnsMenuColumn[];
    truncated?: boolean;
    loading?: boolean;
    className?: string;
    /** Textos propios; ganan al `UiProvider`. */
    labels?: Partial<Labels>;
};
/**
 * Pie estándar de un listado (debajo del `ResponsiveList`):
 * recuento/navegación a la izquierda y, al fondo a la derecha, el menú de
 * columnas (móvil) o el selector de filas por página. La fila se pinta
 * SIEMPRE, aunque no haya navegación, para que todos los listados midan lo
 * mismo.
 *
 * FILAS POR PÁGINA (v0.7.0): con menú de columnas (`onHiddenChange` +
 * `onReset`, lo normal con `useListView`) el pie NO pinta selector: el tamaño
 * vive en el submenú «Filas por página» del `ColumnsMenu` —el de la cabecera
 * de la tabla en escritorio (`listProps.pageSize`/`onPageSizeChange`) y el del
 * pie en móvil o con 0 resultados—. Sin menú de columnas (un consumidor que
 * usa `ListFooter` sin `onHiddenChange`/`onReset`) el selector sigue en el pie
 * como antes. Ojo si montas el `ResponsiveList` a mano: sin pasarle
 * `pageSize`/`onPageSizeChange`, en escritorio no habría dónde cambiar el
 * tamaño.
 *
 * A la izquierda: con más de una página, la propia `Pagination` (rango +
 * flechas); con una sola página, `Pagination` no pinta nada
 * (`total <= pageSize`) así que mostramos aquí el total a secas — el recuento
 * tiene que verse siempre, sea cual sea el número de páginas. Con 0
 * resultados no se pinta nada: la página ya muestra su propio `EmptyState` (lo
 * hacen todas las que usan `ListFooter`) y un «0 resultados» junto a él es
 * ruido redundante.
 *
 * OJO: `Pagination` se monta siempre, aunque no pinte nada, porque dentro
 * lleva el efecto de auto-clamp de página (si el total encoge y la página
 * actual queda fuera de rango). No la condiciones a que haya más de una
 * página o ese efecto deja de correr.
 *
 * TODOS los cortes de este pie son de CONTENEDOR (`@…`), nunca de viewport
 *: el corte tabla/tarjetas de `ResponsiveList` también
 * lo es, y mezclarlos rompía el pie de una lista metida en un panel estrecho
 * con la ventana ancha (dos paneles `md:grid-cols-2`) —
 * entraba en rejilla sin sitio y, con `main` en `overflow-x-clip`, el selector
 * se cortaba sin scroll. Como un elemento no puede consultar su propio tamaño,
 * el `@container` va en un envoltorio SIN layout y la fila es su hijo.
 *
 * Umbrales, medidos sobre el contenido real (texto a 14px):
 * - `@2xl` (42rem = 672px) para la rejilla. El bloque de navegación mide ~266px
 *   (4 botones `size="sm"` de 36px + gap-1 + el rango «1–25 de 3638» con su
 *   px-2) y el grupo derecho ~165px (icono de 32px + gap-2 + el selector de
 *   ~125px con la etiqueta larga). En `1fr auto 1fr` las dos pistas laterales
 *   no bajan de su contenido, así que la fila no cabe por debajo de ~596px.
 *   `@xl` (576px) aún se quedaría corto; `@2xl` deja holgura.
 * - `@md` (28rem = 448px) para la etiqueta larga del selector («25 por página»
 *   vs. solo «25»). Con la etiqueta larga, los dos grupos en una sola línea
 *   miden ~266 + 8 + 165 = ~439px: desde 448px caben sin envolver, y por
 *   debajo la etiqueta corta (~96px de grupo) alarga el tramo que aún cabe.
 *   A 390px de viewport (~358px de contenedor) los dos grupos envuelven, que
 *   es justo lo previsto: `flex-wrap`, nunca scroll horizontal.
 *
 * El bloque de recuento/navegación va CENTRADO respecto a la fila entera, no
 * respecto al hueco que deja el selector: desde `@2xl` la fila es un grid de
 * tres columnas (`1fr auto 1fr`), con ese bloque en la columna del medio (que
 * se ajusta a su contenido) y el grupo de la derecha en la tercera columna
 * con `justify-self-end`; la primera columna queda vacía a propósito, solo
 * para que la del medio quede centrada de verdad. Por debajo sigue siendo un
 * flex que envuelve sin desbordar.
 *
 * El menú de columnas solo aparece aquí en móvil: en escritorio va incrustado
 * en la cabecera de la tabla (`ResponsiveList`), pero en móvil no hay cabecera
 * y las cards sí respetan `hiddenColumns`. El corte es `@3xl`, el MISMO que usa
 * `ResponsiveList` para cambiar de tabla a cards (el pie mide lo mismo que la
 * lista).
 *
 * EXCEPCIÓN con `total === 0`: ahí la página pinta
 * su `EmptyState` en lugar de la tabla, así que el menú incrustado no existe a
 * ningún ancho y quien ocultó columnas se queda sin «Restablecer columnas». El
 * pie pasa a ser el único acceso y lo enseña a CUALQUIER ancho; a cambio se
 * esconde el control de filas por página (selector o submenú), que no
 * gobierna nada visible.
 */
declare function ListFooter({ page, pageSize, total, onPageChange, onPageSizeChange, hidden, onHiddenChange, onReset, compact, onCompactChange, columnOrder, onColumnOrderChange, columns, truncated, loading, className, labels: labelsProp, }: ListFooterProps): React.JSX.Element;

/**
 * Solo las columnas configurables de un `ResponsiveList` (sin orden ni
 * paginación): anchos arrastrables, columnas ocultas, orden de columnas
 * (arrastre de cabecera + «Subir»/«Bajar») y «Restablecer
 * columnas», guardados por usuario bajo `listKey` (kebab-case, único por
 * listado). Para listas que se pintan enteras y se ordenan en cliente.
 *
 *   const columnProps = useListColumns('students', columns.map((c) => c.key))
 *   <ResponsiveList columns={columns} {...columnProps} … />
 *
 * Sin `ListFooter`, el menú de columnas sale encima de las tarjetas en móvil
 * (`mobileColumnsMenu`, activo por defecto).
 */
declare function useListColumns(listKey: string, columnKeys: readonly string[], { store }?: {
    store?: ListPrefsStore;
}): {
    resizable: true;
    columnWidths: Record<string, number>;
    onColumnWidthsChange: (widths: Record<string, number>) => void;
    hiddenColumns: string[];
    onHiddenColumnsChange: (hidden: string[]) => void;
    onColumnsReset: () => void;
    columnOrder: string[];
    onColumnOrderChange: (order: string[]) => void;
};

/** Debounce de la escritura remota de los anchos (un arrastre son decenas de cambios). */
declare const LIST_PREFS_WIDTHS_DEBOUNCE_MS = 400;
/** Clave de localStorage para (usuario, lista); `null` si el usuario aún no se conoce. */
declare function listPrefsStorageKey(userId: string | null | undefined, listKey: string): string | null;
type UseListPrefsOptions = {
    /** Claves de columna que la lista conoce HOY. Todo lo demás se descarta. */
    columnKeys: readonly string[];
    /** Valores por defecto (todos opcionales: sin orden, sin ocultas, sin anchos, 25/pág.). */
    defaults?: ListPrefsDefaults;
    /**
     * Dónde se sincroniza. Por defecto, el `listPrefsStore` del `UiProvider`; y
     * si tampoco hay, solo caché local.
     */
    store?: ListPrefsStore;
};
type UseListPrefsResult = {
    prefs: ListPrefs;
    setHidden: (hidden: string[]) => void;
    setWidths: (widths: Record<string, number>) => void;
    setSort: (sort: ListSort | null) => void;
    setPageSize: (pageSize: number) => void;
    /** Modo compacto (al instante, sin debounce). */
    setCompact: (compact: boolean) => void;
    /** Orden de las columnas (claves), al instante. `[]` = orden de serie. */
    setOrder: (order: string[]) => void;
    /**
     * «Restablecer columnas»: ocultas, anchos y orden de columnas vuelven a los
     * DEFAULTS del listado (`defaults.hidden`, `defaults.widths` o `{}`,
     * `defaults.order` o `[]`), no a «todo visible»; orden de filas, tamaño de
     * página y modo compacto se conservan (la densidad no es una columna).
     */
    reset: () => void;
    /**
     * Las `prefs` ya son las definitivas para pintar y consultar (v0.8.0):
     * `true` si (a) hay caché local de ESTE usuario para esta lista, (b) la
     * consulta al servidor ya terminó (con fila, sin fila o con error), o (c) no
     * hay sesión (`userId === null`, solo local). `false` mientras el usuario
     * se está resolviendo (`undefined`) o, sin caché local, hasta que responde
     * el servidor: ahí `prefs` son los defaults y la lista no debe pintarse ni
     * consultar con ellos.
     */
    isLoaded: boolean;
};
/**
 * Preferencias de un listado configurable (orden, anchos, columnas ocultas,
 * orden de columnas, filas por página, modo compacto), por usuario y sincronizadas entre dispositivos.
 *
 * - Lectura: `list-prefs:<userId>:<listKey>` de localStorage (vía
 *   `safeStorage`; sin sesión, `list-prefs:<listKey>`), sin salto en el primer
 *   render de una SPA y sin error de hidratación en Next. Sin caché local de
 *   este usuario, `isLoaded` espera al servidor.
 *   Cuando llega la fila del almacén remoto, GANA (una vez por usuario y
 *   lista). Si el almacén no tiene fila y la caché local trae algo distinto del
 *   defecto, se sube la local para que el siguiente dispositivo la encuentre.
 * - Escritura: orden, ocultas, orden de columnas, tamaño de página y compacto al instante; anchos con
 *   debounce de 400 ms y flush al desmontar. La caché local se actualiza
 *   siempre, sin esperar al servidor.
 *
 * Necesita un `QueryClientProvider` de TanStack Query por encima.
 */
declare function useListPrefs(listKey: string, { columnKeys, defaults, store: storeProp }: UseListPrefsOptions): UseListPrefsResult;

type SessionLike = {
    user: {
        id: string;
    };
} | null;
/**
 * Forma mínima del cliente de Supabase que usa `useSupabaseListPrefsStore`:
 * `.from()` (el almacén) y `auth.getSession` / `auth.onAuthStateChange` (el
 * usuario con sesión). Tipada a mano, igual que `SupabaseLikeClient`: el
 * paquete no importa `@supabase/supabase-js` en tiempo de ejecución.
 */
type SupabaseLikeAuthClient = SupabaseLikeClient & {
    auth: {
        getSession: () => Promise<{
            data: {
                session: SessionLike;
            };
        }>;
        onAuthStateChange: (callback: (event: string, session: SessionLike) => void) => {
            data: {
                subscription: {
                    unsubscribe: () => void;
                };
            };
        };
    };
};
/**
 * Almacén de Supabase para el usuario con sesión, listo para
 * `UiProvider.listPrefsStore`:
 *
 *   const store = useSupabaseListPrefsStore(supabase)
 *   <UiProvider listPrefsStore={store} …>
 *
 * Sigue al usuario él solo: lee la sesión al montar (`getSession`, local, sin
 * red) y se suscribe a `onAuthStateChange` (login/logout en esta u otra
 * pestaña). Mientras `getSession` no responde, `userId` es `undefined`
 * (desconocido: las listas esperan, `isLoaded` = `false`); sin sesión, `null`
 * (solo caché local). El almacén se
 * memoiza por cliente + usuario + tabla: pasa un cliente ESTABLE (el
 * singleton del navegador, o memoízalo). `onError` se lee de un ref: puede
 * ser una función en línea.
 */
declare function useSupabaseListPrefsStore(client: SupabaseLikeAuthClient, { table, onError }?: SupabaseListPrefsStoreOptions): ListPrefsStore;

export { COLUMN_WIDTH_KEY_ATTR, ColumnsMenu, type ColumnsMenuColumn, type ColumnsMenuProps, DEFAULT_ACTION_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH, DEFAULT_PAGE_SIZE, LIST_PREFS_WIDTHS_DEBOUNCE_MS, ListFooter, type ListFooterProps, ListPrefs, ListPrefsDefaults, ListPrefsStore, ListSort, type ListView, type ListViewDefaults, type ListViewFooterProps, type ListViewListProps, MIN_COLUMN_WIDTH, Pagination, type PaginationProps, type ResponsiveColumn, ResponsiveList, type ResponsiveListProps, type SizedColumn, type SupabaseLikeAuthClient, SupabaseLikeClient, SupabaseListPrefsStoreOptions, TINTED_ROW_CLASS, TOUCH_TEXT_LINK, type UnpaginatedListView, type UseListPrefsOptions, type UseListPrefsResult, type UseListViewOptions, columnFloor, isFillColumn, listPrefsStorageKey, moveColumn, orderColumns, resolveColumnWidth, resolveFillColumnKey, rowTone, tableSizing, useColumnResize, useListColumns, useListCompact, useListPrefs, useListView, usePagination, useSupabaseListPrefsStore, visibleColumnsOf };

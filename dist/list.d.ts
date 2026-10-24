import * as React from 'react';
import { CSSProperties } from 'react';
import { h as ListSort, c as Labels, e as ListPrefs, f as ListPrefsDefaults, g as ListPrefsStore, i as SupabaseLikeClient, j as SupabaseListPrefsStoreOptions } from './UiProvider-CLCu_JgN.js';
export { D as DEFAULT_LIST_PAGE_SIZE, E as EMPTY_LIST_PREFS, L as LIST_PAGE_SIZES, a as LIST_PREFS_STORAGE_PREFIX, b as LIST_WIDTHS_VERSION, d as ListPageSize, S as SortDir, n as createSupabaseListPrefsStore, p as hasLegacyWidths, q as isListPageSize, r as listPrefsEqual, s as localOnlyListPrefsStore, t as normalizeListPrefs, u as resolveListDefaults } from './UiProvider-CLCu_JgN.js';

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
    columnWidthsLegacy?: boolean;
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
declare function ResponsiveList<T>({ columns, data, rowKey, rowHref, onRowClick, rowHoverProps, leading, isRowSelected, rowClassName, rowStyle, sort, onSortChange, resizable, columnWidths, columnWidthsLegacy, onColumnWidthsChange, hiddenColumns, onHiddenColumnsChange, onColumnsReset, mobileColumnsMenu, compact, onCompactChange, columnOrder, onColumnOrderChange, pageSize, onPageSizeChange, stickyHeader, stickyHeaderTop, ready, className, labels: labelsProp, }: ResponsiveListProps<T>): React.JSX.Element;

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
 * relleno y, si las columnas no llegan al ancho del contenedor, el sobrante se
 * reparte en proporción entre todas (v0.9.6, ver `tableSizing`). Nunca se
 * elige sola (ni la `primary`): la decide el consumidor.
 *
 * v0.9.9: el «tope» de LIST-6 (0.9.8) desaparece: con ancho guardado es una
 * columna normal más del reparto proporcional. Que un ancho de relleno
 * guardado en una pantalla grande no dé scroll en una menor lo resuelve ahora
 * `useColumnResize` (las columnas encogen hasta su suelo y el mínimo de la
 * tabla es como mucho el de serie).
 *
 * v0.9.6: con `widths` (los anchos guardados del usuario), si esa columna
 * tiene ancho guardado deja de ser LA de relleno: manda su ancho (también para
 * estrecharla) y la tabla sigue al 100 % repartiendo el sobrante entre todas
 * (ver `tableSizing`). NO pasa el relleno a otra columna marcada. Doble clic
 * en su asa (se borra el guardado) la vuelve a hacer relleno.
 */
declare function resolveFillColumnKey(columns: SizedColumn[], widths?: Record<string, number>): string | undefined;
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
 * Estilo de la `<table>` (table-fixed): SIEMPRE `width: 100%` y
 * `min-width: suma` (v0.9.6, dueño 21/10/2026: la tabla ocupa todo el ancho,
 * nunca hueco a la derecha).
 * - Con columna de relleno (sin ancho guardado): su `<col>` va SIN ancho y
 *   table-fixed le da todo lo que sobre; el resto no se mueve.
 * - Sin relleno (ninguna marcada, o el usuario la dimensionó): todas las
 *   `<col>` llevan ancho y table-fixed reparte el sobrante entre ellas en
 *   proporción. Estrechar una columna se nota y se queda.
 * Si la suma supera el contenedor, la tabla lo desborda y el contenedor de
 * scroll la desplaza a lo ancho; con el contenedor medido, `useColumnResize`
 * pasa aquí un mínimo menor (el de serie) y encoge las columnas (v0.9.9).
 * `hasFill` se conserva por compatibilidad.
 */
declare function tableSizing(totalWidth: number, _hasFill?: boolean): {
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
 * Techo de un ancho guardado ANTES de 0.9.9 (sin marca `widthsV: 2`), en
 * múltiplos de su ancho de serie (v0.9.10, UI-RESIZE-2). Ver
 * `useColumnResize` («Anchos viejos»).
 */
declare const STORED_WIDTH_MAX_FACTOR = 1.5;
/** Paso (px) de ←/→ en el asa enfocada (v0.9.7): 1 rem. */
declare const RESIZE_KEY_STEP = 16;
/** Paso (px) de Mayús+←/→ en el asa enfocada (v0.9.7): 4 rem. */
declare const RESIZE_KEY_STEP_LARGE = 64;
/**
 * Techo (px) del teclado y `aria-valuemax` del asa (v0.9.7). El ratón no tiene
 * techo; si el ancho ya lo supera, `aria-valuemax` es el propio ancho.
 */
declare const RESIZE_KEY_MAX = 1600;
/**
 * Columnas redimensionables con el ratón y el teclado: asa en los bordes entre
 * cabeceras, doble clic para devolver la columna a su ancho de serie.
 *
 * Vive aparte de `ResponsiveList` porque también lo usan tablas a mano (p. ej.
 * una tabla de líneas con celdas editables). Los anchos se persisten con
 * `useListPrefs` (`setWidths`).
 *
 * Mecánica: pointer events CON captura, así el arrastre sigue aunque el puntero
 * salga de la celda. Mientras se arrastra el ancho vive en el estado local
 * (`drag`) y solo se persiste al soltar: un arrastre son decenas de eventos.
 *
 * Modelo proporcional (v0.9.9, dueño 24/10/2026; con `columns`):
 * - La tabla mide SIEMPRE el 100 % del contenedor. Cada columna tiene una
 *   base (`resolveColumnWidth`: guardada, `width` o `DEFAULT_COLUMN_WIDTH`,
 *   nunca por debajo de su suelo `columnFloor`). Si sobra sitio, table-fixed
 *   lo reparte en proporción a las bases; si falta, las columnas encogen en
 *   proporción hasta su suelo EN PANTALLA (las que llegan se quedan en él y el
 *   resto sigue encogiendo), con los anchos calculados aquí en cada `<col>`.
 *   El scroll lateral solo aparece por debajo de `minColumns`: la suma de
 *   bases o la de serie, la menor (nunca menos que los suelos). Así agrandar
 *   columnas nunca trae scroll, en esta pantalla ni en otra menor (LIST-6).
 * - Agrandar una columna = subir SU base: las demás encogen en proporción
 *   (conservan sus proporciones entre sí) y ninguna baja de su suelo en
 *   pantalla; cuando todas las demás están en su suelo, la arrastrada ya no
 *   crece más. Estrecharla para en su propio suelo. Se guarda SOLO la base de
 *   la arrastrada (las demás siguen su `width` de serie, que en Gesmoto va en
 *   rem y escala con la fuente), calculada para que en ESTE contenedor se vea
 *   exactamente lo que se soltó.
 * - Qué columna controla cada asa: la de la IZQUIERDA del borde, salvo el
 *   último borde (entre la penúltima y la última), que controla la ÚLTIMA:
 *   arrastrarlo a la izquierda agranda la última (p. ej. «Acciones»), a la
 *   derecha la estrecha. `resizeHandle(penúltima)` y
 *   `resizeHandle(penúltima, 'start')` hacen eso solos.
 * - El ratón manda: se resuelve, con el mismo modelo con el que se pinta, la
 *   base que deja el borde derecho de la columna exactamente bajo el puntero
 *   (en el último borde, el ancho de la última). Tras un relleno libre el
 *   borde derecho no se mueve (el relleno absorbe), así que ahí se sigue el
 *   ancho de la columna.
 * - Relleno (`fill: true`, alias `flex`; la primera marcada): sin ancho
 *   guardado se queda el sobrante (su `<col>` sin ancho). Agrandar otra
 *   columna le quita primero ese sobrante (las demás no se mueven) y, cuando
 *   ya está a su base, encogen todas en proporción. Arrastrar el propio
 *   relleno lo convierte en columna normal: parte de su ancho PINTADO (sin
 *   saltos) y al soltar se guarda su base; con ancho guardado deja de ser
 *   relleno (`resolveFillColumnKey`, v0.9.6). Doble clic, Escape o Supr lo
 *   vuelven a hacer relleno. El ancho guardado de un relleno (también el de
 *   0.9.6-0.9.8, p. ej. 566 a 1920) ya no trae scroll en pantallas menores:
 *   lo impide `minColumns`.
 * - Anchos viejos (v0.9.10, UI-RESIZE-2; `legacyWidths`, con contenedor
 *   medido): hasta la 0.9.8 un ancho guardado era un ancho fijo (con scroll si
 *   no cabía) o, en el relleno, un tope; con el reparto proporcional un
 *   `client: 566` de entonces apretaba a las demás (Apertura a 100 px). Si
 *   los anchos vienen de antes de la marca (`widthsV: 2`, ver
 *   `hasLegacyWidths`), cada ancho guardado se lee como mucho a `capOf`: lo
 *   mayor entre 1,5 × su ancho de serie (`STORED_WIDTH_MAX_FACTOR`) y lo que
 *   le dejan las demás a su ancho de serie dentro del contenedor. La primera
 *   escritura (arrastre, teclado, doble clic) guarda ya los anchos LIMITADOS
 *   (los que se ven) y `useListPrefs.setWidths` les pone la marca: desde ahí
 *   no hay techo. El arrastre y el teclado no tienen techo nunca (el modelo
 *   de 0.9.9: las demás encogen hasta su suelo).
 * Sin `columns` (tablas a mano antiguas, p. ej. las líneas de presupuesto de
 * Gesmoto): cambia la arrastrada, 1:1, partiendo del ancho guardado o, si no
 * hay, del medido; suelo `MIN_COLUMN_WIDTH`.
 *
 * Teclado (v0.9.7, LIST-4): el asa `'end'` es un `role="separator"` enfocable
 * (`aria-orientation="vertical"`, `aria-label` = `labels.columnResize(columna
 * que controla)`, `aria-valuenow/min/max` en px de esa columna). ←/→ mueven el
 * borde 16 px (1 rem) EN PANTALLA, Mayús+←/→ 64 px (en el último borde, ←
 * agranda la última); se ve en vivo y se guarda al soltar la tecla (o al
 * perder el foco), por el mismo `onColumnWidthsChange` que el arrastre y con
 * el mismo suelo. Escape, Supr o Retroceso borran el ancho guardado de la
 * columna que controla, como el doble clic. La mitad `'start'` no es
 * enfocable (sería el mismo borde dos veces en el Tab).
 */
declare function useColumnResize({ columnWidths, onColumnWidthsChange, columns, containerWidth, leadingWidth, legacyWidths, labels: labelsProp, }: {
    columnWidths?: Record<string, number>;
    onColumnWidthsChange?: (widths: Record<string, number>) => void;
    /** Columnas VISIBLES, en orden: activa el modelo proporcional. */
    columns?: SizedColumn[];
    /**
     * Ancho (px) del contenedor de la `<table>` (v0.9.8). Con él, las columnas
     * encogen en proporción (hasta su suelo) cuando no caben, en vez de dar
     * scroll, y el arrastre sabe la escala. Sin él (o 0, como en jsdom), cada
     * `<col>` lleva su base y la tabla mide como mínimo la suma.
     * `ResponsiveList` lo mide con un ResizeObserver.
     */
    containerWidth?: number;
    /** Px de columnas fuera de `columns`, DELANTE (p. ej. la de selección). */
    leadingWidth?: number;
    /**
     * `columnWidths` viene de antes de 0.9.9 (sin `widthsV: 2`; v0.9.10,
     * UI-RESIZE-2): se lee con techo y la primera escritura lo guarda limitado.
     * `useListView` lo pasa en `listProps.columnWidthsLegacy`.
     */
    legacyWidths?: boolean;
    /** Textos propios (`columnResize`); ganan al `UiProvider`. */
    labels?: Partial<Labels>;
}): {
    widthOf: (key: string) => number | undefined;
    colWidth: (key: string) => number | undefined;
    fillKey: string | undefined;
    /** @deprecated v0.9.0: usa `fillKey`. */
    flexKey: string | undefined;
    totalWidth: number | undefined;
    tableStyle: (extra?: number) => React.CSSProperties | undefined;
    resizeHandle: (columnKey: string, edge?: "end" | "start", name?: string) => React.JSX.Element;
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
    columnWidthsLegacy?: boolean;
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
    columnWidthsLegacy: boolean;
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

export { COLUMN_WIDTH_KEY_ATTR, ColumnsMenu, type ColumnsMenuColumn, type ColumnsMenuProps, DEFAULT_ACTION_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH, DEFAULT_PAGE_SIZE, LIST_PREFS_WIDTHS_DEBOUNCE_MS, ListFooter, type ListFooterProps, ListPrefs, ListPrefsDefaults, ListPrefsStore, ListSort, type ListView, type ListViewDefaults, type ListViewFooterProps, type ListViewListProps, MIN_COLUMN_WIDTH, Pagination, type PaginationProps, RESIZE_KEY_MAX, RESIZE_KEY_STEP, RESIZE_KEY_STEP_LARGE, type ResponsiveColumn, ResponsiveList, type ResponsiveListProps, STORED_WIDTH_MAX_FACTOR, type SizedColumn, type SupabaseLikeAuthClient, SupabaseLikeClient, SupabaseListPrefsStoreOptions, TINTED_ROW_CLASS, TOUCH_TEXT_LINK, type UnpaginatedListView, type UseListPrefsOptions, type UseListPrefsResult, type UseListViewOptions, columnFloor, isFillColumn, listPrefsStorageKey, moveColumn, orderColumns, resolveColumnWidth, resolveFillColumnKey, rowTone, tableSizing, useColumnResize, useListColumns, useListCompact, useListPrefs, useListView, usePagination, useSupabaseListPrefsStore, visibleColumnsOf };

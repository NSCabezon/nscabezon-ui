import { ClassValue } from 'clsx';
import { CSSProperties } from 'react';

declare const safeStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
};

declare function cn(...inputs: ClassValue[]): string;

/** Dirección de orden de una columna. */
type SortDir = 'asc' | 'desc';
/** Orden servidor de un listado: columna + dirección. */
type ListSort = {
    key: string;
    dir: SortDir;
};
type ListPrefs = {
    hidden: string[];
    widths: Record<string, number>;
    sort: ListSort | null;
    pageSize: number;
    compact: boolean;
    order: string[];
};
declare const LIST_PAGE_SIZES: readonly [10, 25, 50, 100];
type ListPageSize = (typeof LIST_PAGE_SIZES)[number];
declare const DEFAULT_LIST_PAGE_SIZE: ListPageSize;
declare function isListPageSize(value: unknown): value is ListPageSize;
declare const LIST_PREFS_STORAGE_PREFIX = "list-prefs:";
/**
 * Sanea unas preferencias leídas de fuera (localStorage o BD) contra las
 * columnas que la lista conoce HOY. Es un reducer puro: nunca lanza.
 *
 * - Columnas ocultas: solo claves conocidas, sin repetidos.
 * - Anchos: solo claves conocidas con un número finito y positivo (redondeado).
 * - Orden: solo si la clave es conocida y `dir` es asc/desc; si no, el orden
 *   por defecto de la lista (nunca «sin orden»).
 * - Tamaño de página: solo uno de LIST_PAGE_SIZES; si no, el de `defaults`
 *   (y si ese tampoco vale, DEFAULT_LIST_PAGE_SIZE). No es una clave de
 *   columna: `knownKeys` no le afecta.
 * - Compacto: solo un booleano; si no, el de `defaults` (y si ese tampoco lo
 *   es, `false`).
 * - Orden de columnas: solo claves conocidas, sin repetidas, y las columnas
 *   conocidas que falten se AÑADEN AL FINAL (una columna nueva aparece detrás
 *   de las que el usuario ya colocó). Si no es un array, el de `defaults`; un
 *   array sin ninguna clave conocida queda en `[]` (orden de serie).
 *
 * Una columna renombrada o eliminada deja de aparecer sin romper nada, y un
 * `prefs` corrupto vuelve a los valores por defecto.
 */
declare function normalizeListPrefs(raw: unknown, knownKeys: string[], defaults: ListPrefs): ListPrefs;
/** Igualdad estructural, para no escribir en BD lo que ya está. */
declare function listPrefsEqual(a: ListPrefs, b: ListPrefs): boolean;
/**
 * Valores por defecto de un listado tal como los escribe una página: todo es
 * opcional (sin orden, sin ocultas, sin anchos, 25 por página, sin compacto,
 * columnas en su orden de serie).
 */
type ListPrefsDefaults = {
    sort?: ListSort | null;
    hidden?: string[];
    widths?: Record<string, number>;
    pageSize?: number;
    compact?: boolean;
    order?: string[];
};
/** Rellena los opcionales de unos defaults para obtener unas `ListPrefs`. */
declare function resolveListDefaults(defaults?: ListPrefsDefaults): ListPrefs;
/**
 * Preferencias vacías: sin ocultas, sin anchos, sin orden, 25 por página, sin
 * compacto, columnas en su orden de serie.
 */
declare const EMPTY_LIST_PREFS: ListPrefs;

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
 *
 * v0.9.3: con `widths` (los anchos guardados del usuario), si esa columna
 * tiene ancho guardado deja de rellenar y la tabla queda SIN relleno (hueco a
 * la derecha, como Excel): el usuario la ha dimensionado a mano y manda su
 * ancho, también para estrecharla. NO pasa el relleno a otra columna marcada:
 * una segunda `fill` empezaría a estirarse sola sin que nadie la tocara.
 * Doble clic en su asa (se borra el guardado) la vuelve a hacer relleno.
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

type OAuthProvider = 'google' | 'apple';
type AuthMethod = 'email' | OAuthProvider;
/** Clave de `localStorage` por defecto. Cada app puede pasar la suya. */
declare const DEFAULT_LAST_AUTH_METHOD_KEY = "ui.lastAuthMethod";
/** Último método usado, o `null` si no hay dato, no es válido o no hay storage. Nunca lanza. */
declare function getLastAuthMethod(storageKey?: string): AuthMethod | null;
/** Guarda el método. Si no hay storage (modo privado / bloqueado) se ignora: el hint es opcional. */
declare function setLastAuthMethod(method: AuthMethod, storageKey?: string): void;

export { type AuthMethod, DEFAULT_ACTION_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH, DEFAULT_LAST_AUTH_METHOD_KEY, DEFAULT_LIST_PAGE_SIZE, EMPTY_LIST_PREFS, LIST_PAGE_SIZES, LIST_PREFS_STORAGE_PREFIX, type ListPageSize, type ListPrefs, type ListPrefsDefaults, type ListSort, MIN_COLUMN_WIDTH, type OAuthProvider, type SizedColumn, type SortDir, TINTED_ROW_CLASS, cn, columnFloor, getLastAuthMethod, isFillColumn, isListPageSize, listPrefsEqual, normalizeListPrefs, resolveColumnWidth, resolveFillColumnKey, resolveListDefaults, rowTone, safeStorage, setLastAuthMethod, tableSizing, visibleColumnsOf };

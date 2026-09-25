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
};
declare const LIST_PAGE_SIZES: readonly [10, 25, 50];
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
 *
 * Una columna renombrada o eliminada deja de aparecer sin romper nada, y un
 * `prefs` corrupto vuelve a los valores por defecto.
 */
declare function normalizeListPrefs(raw: unknown, knownKeys: string[], defaults: ListPrefs): ListPrefs;
/** Igualdad estructural, para no escribir en BD lo que ya está. */
declare function listPrefsEqual(a: ListPrefs, b: ListPrefs): boolean;
/**
 * Valores por defecto de un listado tal como los escribe una página: todo es
 * opcional (sin orden, sin ocultas, sin anchos, 25 por página).
 */
type ListPrefsDefaults = {
    sort?: ListSort | null;
    hidden?: string[];
    widths?: Record<string, number>;
    pageSize?: number;
};
/** Rellena los opcionales de unos defaults para obtener unas `ListPrefs`. */
declare function resolveListDefaults(defaults?: ListPrefsDefaults): ListPrefs;
/** Preferencias vacías: sin ocultas, sin anchos, sin orden, 25 por página. */
declare const EMPTY_LIST_PREFS: ListPrefs;

declare const DEFAULT_ACTION_COLUMN_WIDTH = 56;
/**
 * Ancho a aplicar en el <colgroup> de un ResponsiveList `resizable`: lo
 * guardado/arrastrado gana siempre; si no hay nada guardado, el `width` de la
 * columna; las `action` sin ninguno de los dos y SIN cabecera (icono suelto)
 * caen al ancho compacto por defecto. Una `action` CON cabecera es la
 * convención de un botón con texto: sin `width` propio se queda sin <col>
 * width y comparte el sobrante de table-fixed como cualquier otra columna.
 * `undefined` = "sin <col> width": la señal con la que table-fixed reparte el
 * sobrante en esa columna.
 */
declare function resolveColumnWidth(col: {
    width?: number;
    action?: boolean;
    header?: unknown;
}, stored: number | undefined): number | undefined;
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

export { DEFAULT_ACTION_COLUMN_WIDTH, DEFAULT_LIST_PAGE_SIZE, EMPTY_LIST_PREFS, LIST_PAGE_SIZES, LIST_PREFS_STORAGE_PREFIX, type ListPageSize, type ListPrefs, type ListPrefsDefaults, type ListSort, type SortDir, TINTED_ROW_CLASS, cn, isListPageSize, listPrefsEqual, normalizeListPrefs, resolveColumnWidth, resolveListDefaults, rowTone, safeStorage, visibleColumnsOf };

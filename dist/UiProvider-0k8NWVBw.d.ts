import * as React from 'react';

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

/**
 * Dónde se sincronizan las preferencias de listado entre dispositivos.
 *
 * - `userId`: usuario con sesión. `null` = no hay nada remoto que leer ni
 *   escribir (solo caché local). Cambiar de usuario vuelve a reconciliar.
 * - `load`: fila guardada para esa lista, SIN normalizar (el hook la sanea
 *   contra las columnas de hoy), o `null` si no hay fila. Si lanza, el hook se
 *   queda con la caché local.
 * - `save`: upsert de la fila. Los errores se tragan (son preferencias de
 *   pantalla; el siguiente cambio lo vuelve a intentar).
 */
type ListPrefsStore = {
    userId: string | null;
    load: (listKey: string) => Promise<unknown | null>;
    save: (listKey: string, prefs: ListPrefs) => Promise<void>;
};
/** Solo caché local (localStorage): sin usuario, nada remoto. */
declare const localOnlyListPrefsStore: ListPrefsStore;
/**
 * Forma mínima del cliente de Supabase que usa el almacén. Tipada a mano (y no
 * con `SupabaseClient`) para no acoplar el paquete a los tipos generados de
 * cada app ni obligar a instalar `@supabase/supabase-js` a quien no lo use.
 */
type SupabaseLikeClient = {
    from: (table: string) => any;
};
type SupabaseListPrefsStoreOptions = {
    /** Tabla con columnas (user_id uuid, list_key text, prefs jsonb). Por defecto `user_list_prefs`. */
    table?: string;
    /** Se llama cuando falla la escritura. Por defecto, `console.warn` fuera de producción. */
    onError?: (error: unknown) => void;
};
/**
 * Almacén sobre la tabla `user_list_prefs(user_id, list_key, prefs jsonb)`,
 * con PK (user_id, list_key) y RLS «cada usuario lo suyo» (mismo esquema en
 * Gesmoto y TusExámenes).
 *
 * Crea uno por usuario y memoízalo: `useMemo(() =>
 * createSupabaseListPrefsStore(supabase, userId), [userId])`. En React lo
 * normal es `useSupabaseListPrefsStore(supabase)`, que además sigue la sesión.
 */
declare function createSupabaseListPrefsStore(client: SupabaseLikeClient, userId: string | null | undefined, { table, onError }?: SupabaseListPrefsStoreOptions): ListPrefsStore;

/**
 * Textos visibles del paquete. Los que llevan números son funciones: así cada
 * app resuelve el plural y la interpolación con su propio sistema (Gesmoto,
 * `t('pagination.count', { count })`; TusExámenes, los valores por defecto).
 */
type Labels = {
    /** Botón (aria-label/title) y nombre sr-only de la columna del menú de columnas. */
    columnsMenu: string;
    /** Última opción del menú de columnas. */
    columnsReset: string;
    paginationFirst: string;
    paginationPrev: string;
    paginationNext: string;
    paginationLast: string;
    /** «1–25 de 300». */
    paginationRange: (from: number, to: number, total: number) => string;
    /** «1–25 de los primeros 300» (la consulta viene recortada por un tope). */
    paginationRangeTruncated: (from: number, to: number, total: number) => string;
    /** «1 resultado» / «N resultados». */
    count: (count: number) => string;
    /** «solo el primer resultado» / «solo los primeros N resultados». */
    countTruncated: (count: number) => string;
    /** aria-label/title del selector de filas por página. */
    pageSizeLabel: string;
    /** «25 por página». */
    pageSizeValue: (count: number) => string;
    /** Anuncio sr-only con 0 resultados. */
    noResults: string;
    /** Texto sr-only del spinner de carga del pie. */
    loading: string;
    /** Toast de versión nueva. */
    versionMessage: string;
    /** Acción del toast de versión nueva (recarga la página). */
    versionAction: string;
};
declare const defaultLabels: Labels;
/** Props mínimas que el paquete pasa al `Link` de la app. */
type UiLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
    className?: string;
    children?: React.ReactNode;
};
type UiContextValue = {
    /** Enlace del router de la app (next/link, react-router…). Por defecto, un `<a>`. */
    Link: React.ComponentType<UiLinkProps>;
    /** Navegación imperativa (click en el resto de la fila). Por defecto, `location.assign`. */
    navigate: (href: string) => void;
    /** Textos resueltos (defecto español + lo que pase la app). */
    labels: Labels;
    /** Almacén de preferencias de listado por defecto de `useListPrefs`. */
    listPrefsStore?: ListPrefsStore;
};
type UiProviderProps = {
    Link?: React.ComponentType<UiLinkProps>;
    navigate?: (href: string) => void;
    labels?: Partial<Labels>;
    listPrefsStore?: ListPrefsStore;
    children?: React.ReactNode;
};
/**
 * Integra el paquete con la app: router (Link + navigate), textos y almacén
 * de preferencias de listado. Todo es opcional; sin provider se usan `<a>`,
 * `location.assign`, los textos en español y preferencias solo locales.
 *
 * Estabilidad: el valor del contexto solo cambia cuando cambian `Link`,
 * `listPrefsStore` o el CONTENIDO de `labels` (claves y textos). Se pueden
 * pasar `navigate={(href) => router.push(href)}` y un objeto `labels` literal
 * sin memoizar: `navigate` y las etiquetas-función se exponen como delegados
 * estables que llaman siempre a la última versión recibida.
 */
declare function UiProvider({ Link, navigate, labels, listPrefsStore, children }: UiProviderProps): React.JSX.Element;
declare function useUi(): UiContextValue;
/** Textos efectivos: defecto < `UiProvider` < `override` (prop del componente). */
declare function useLabels(override?: Partial<Labels>): Labels;

export { DEFAULT_LIST_PAGE_SIZE as D, EMPTY_LIST_PREFS as E, LIST_PAGE_SIZES as L, type SortDir as S, type UiContextValue as U, LIST_PREFS_STORAGE_PREFIX as a, type Labels as b, type ListPageSize as c, type ListPrefs as d, type ListPrefsDefaults as e, type ListPrefsStore as f, type ListSort as g, type SupabaseLikeClient as h, type SupabaseListPrefsStoreOptions as i, type UiLinkProps as j, UiProvider as k, type UiProviderProps as l, createSupabaseListPrefsStore as m, defaultLabels as n, isListPageSize as o, listPrefsEqual as p, localOnlyListPrefsStore as q, normalizeListPrefs as r, resolveListDefaults as s, useUi as t, useLabels as u };

import { b as Labels } from './UiProvider-DY1tWBS9.js';
import 'react';

declare const VERSION_POLL_INTERVAL_MS: number;
declare const VERSION_FOCUS_THROTTLE_MS = 60000;
/**
 * Lee `{ "version": "…" }` de una URL sin caché. Devuelve `null` ante
 * cualquier cosa rara: error HTTP, respuesta que no es JSON (un fallback SPA
 * que sirve index.html), campo ausente o vacío, o error de red.
 */
declare function fetchVersionJson(url: string): Promise<string | null>;
type UseVersionCheckOptions = {
    /** Versión desplegada ahora mismo (o `null` si no se sabe). Puede lanzar: se ignora. */
    fetchVersion: () => Promise<string | null>;
    /** Versión con la que se construyó este bundle. */
    currentVersion: string;
    /** Solo en producción, normalmente. Por defecto `true`. */
    enabled?: boolean;
    /** Textos del toast (`versionMessage`, `versionAction`); ganan al `UiProvider`. */
    labels?: Partial<Pick<Labels, 'versionMessage' | 'versionAction'>>;
    /** Acción del toast. Por defecto, `location.reload()`. */
    onReload?: () => void;
};
/**
 * Consulta la versión desplegada cada 5 min (más una comprobación inmediata
 * al montar, para no hacer esperar 5 min a una pestaña que ya estaba abierta)
 * y al recuperar foco/visibilidad (con throttle de 1 min); muestra un toast
 * persistente de sonner con acción «Actualizar» cuando hay una versión nueva.
 *
 * El efecto solo depende de `enabled`: `fetchVersion`, `currentVersion`, los
 * textos y `onReload` se leen de un ref actualizado en cada render. Si
 * estuvieran en las deps, cualquier cambio de identidad (un `t` nuevo de i18n
 * al cargar un namespace, una función inline) reiniciaría el `setInterval` de
 * 5 min — que entonces no llegaba a cumplirse nunca.
 */
declare function useVersionCheck({ fetchVersion, currentVersion, enabled, labels: labelsProp, onReload, }: UseVersionCheckOptions): void;

export { type UseVersionCheckOptions, VERSION_FOCUS_THROTTLE_MS, VERSION_POLL_INTERVAL_MS, fetchVersionJson, useVersionCheck };

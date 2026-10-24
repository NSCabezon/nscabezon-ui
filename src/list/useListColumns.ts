import { useListPrefs } from '../prefs/useListPrefs'
import type { ListPrefsStore } from '../prefs/stores'
import { hasLegacyWidths } from '../prefs/listPrefs'

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
export function useListColumns(
  listKey: string,
  columnKeys: readonly string[],
  { store }: { store?: ListPrefsStore } = {},
) {
  const { prefs, setHidden, setWidths, setOrder, reset } = useListPrefs(listKey, {
    columnKeys,
    store,
  })
  return {
    resizable: true as const,
    columnWidths: prefs.widths,
    // v0.9.10 (UI-RESIZE-2): anchos de antes de 0.9.9, leídos con techo.
    columnWidthsLegacy: hasLegacyWidths(prefs),
    onColumnWidthsChange: setWidths,
    hiddenColumns: prefs.hidden,
    onHiddenColumnsChange: setHidden,
    onColumnsReset: reset,
    columnOrder: prefs.order,
    onColumnOrderChange: setOrder,
  }
}

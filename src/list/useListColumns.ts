import { useListPrefs } from '../prefs/useListPrefs'
import type { ListPrefsStore } from '../prefs/stores'

/**
 * Solo las columnas configurables de un `ResponsiveList` (sin orden ni
 * paginación): anchos arrastrables, columnas ocultas y «Restablecer
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
  const { prefs, setHidden, setWidths, reset } = useListPrefs(listKey, { columnKeys, store })
  return {
    resizable: true as const,
    columnWidths: prefs.widths,
    onColumnWidthsChange: setWidths,
    hiddenColumns: prefs.hidden,
    onHiddenColumnsChange: setHidden,
    onColumnsReset: reset,
  }
}

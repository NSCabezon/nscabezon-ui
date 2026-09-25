import { Loader2 } from 'lucide-react'

import { cn } from '../lib/cn'
import { ColumnsMenu, type ColumnsMenuColumn } from './columns-menu'
import { Pagination } from './pagination'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../primitives/select'
import { LIST_PAGE_SIZES } from '../prefs/listPrefs'
import { useLabels, type Labels } from '../context/UiProvider'
import type { ListViewFooterProps } from './useListView'

export type ListFooterProps = ListViewFooterProps & {
  // Total de la consulta (lo único que no sale de `useListView`).
  total: number
  // Columnas del `ResponsiveList`, para el menú de columnas de móvil.
  columns: ColumnsMenuColumn[]
  // `total` no es el total real: la consulta viene recortada por un tope y hay
  // más resultados de los que se enseñan. El recuento lo dice («primeros N»)
  // en vez de mentir con un total cerrado.
  truncated?: boolean
  // La consulta está trayendo la página nueva mientras enseña `placeholderData`
  // (`keepPreviousData`): sin esta señal el cambio de página no avisa de nada
  // hasta que llegan las filas. Pinta un spinner mudo junto al recuento —no
  // desplaza el layout, así que un cambio de página rápido no da tirones.
  loading?: boolean
  className?: string
  /** Textos propios; ganan al `UiProvider`. */
  labels?: Partial<Labels>
}

/**
 * Pie estándar de un listado (debajo del `ResponsiveList`):
 * recuento/navegación a la izquierda y, al fondo a la derecha, el selector de
 * filas por página. La fila se pinta SIEMPRE, aunque no haya navegación, para
 * que todos los listados midan lo mismo.
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
 * esconde el selector de filas por página, que no gobierna nada visible y
 * quedaba solo, clavado al fondo del visor.
 */
export function ListFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  hidden,
  onHiddenChange,
  onReset,
  columns,
  truncated,
  loading,
  className,
  labels: labelsProp,
}: ListFooterProps) {
  const labels = useLabels(labelsProp)
  const label = labels.pageSizeLabel
  // `Pagination` no pinta nada con total <= pageSize: ahí mostramos el total a
  // secas para que el recuento siga visible. Con 0 resultados no hay nada que
  // contar aparte del `EmptyState` de la página, así que no se pinta.
  const showCountOnly = total > 0 && total <= pageSize
  // Sin tabla no hay menú de columnas incrustado: el del pie deja de ser solo
  // para móvil y el selector de filas se retira.
  const isEmpty = total === 0
  // Buscar o filtrar cambiaba la lista sin que el
  // lector de pantalla dijera nada. Región `status` SIEMPRE montada (una región
  // viva que aparece junto con su texto no se anuncia de forma fiable) con el
  // recuento; mientras llega la página nueva `total` es aún el anterior
  // (`keepPreviousData`), así que solo se anuncia cuando el número cambia.
  const status = isEmpty
    ? labels.noResults
    : truncated
      ? labels.countTruncated(total)
      : labels.count(total)
  return (
    // El `@container` va aquí y el layout en el hijo: un elemento no puede
    // consultarse a sí mismo.
    <div className={cn('@container', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 pt-2',
          '@2xl:grid @2xl:grid-cols-[1fr_auto_1fr]',
        )}
      >
        {/* Columna izquierda vacía: solo existe para que la del medio quede
            centrada de verdad. No ocupa hueco en el flex de móvil. */}
        <span className="hidden @2xl:block" aria-hidden="true" />
        <span role="status" className="sr-only">
          {status}
        </span>
        <div className="flex items-center justify-center gap-2">
          {showCountOnly && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {truncated
                ? labels.countTruncated(total)
                : labels.count(total)}
            </span>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            truncated={truncated}
            className="pt-0"
            labels={labelsProp}
          />
          {/* Espacio reservado siempre (`size-4`): el spinner solo entra/sale
              de contenido, nunca de hueco, para que activar/desactivar `loading`
              en cada cambio de página no dé tirones al resto de la fila. */}
          <span
            aria-live="polite"
            className="inline-flex size-4 shrink-0 items-center justify-center"
          >
            {loading && (
              <>
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="sr-only">{labels.loading}</span>
              </>
            )}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 @2xl:ml-0 @2xl:justify-self-end">
          <ColumnsMenu
            className={isEmpty ? undefined : '@3xl:hidden'}
            columns={columns}
            hidden={hidden}
            onHiddenChange={onHiddenChange}
            onReset={onReset}
            labels={labelsProp}
          />
          {!isEmpty && (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger aria-label={label} title={label} className="tabular-nums">
                <span className="@md:hidden">{pageSize}</span>
                <span className="hidden @md:inline">
                  {labels.pageSizeValue(pageSize)}
                </span>
              </SelectTrigger>
              {/* position="popper": el modo por defecto (item-aligned) mide el
                  `SelectValue` del disparador y aquí pintamos texto propio, así
                  que Radix no lo anclaba y abría el desplegable al pie de la
                  página (04/09). */}
              <SelectContent align="end" position="popper">
                {LIST_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)} className="tabular-nums">
                    {labels.pageSizeValue(size)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}

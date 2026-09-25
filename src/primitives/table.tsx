
import * as React from 'react'

import { cn } from '../lib/cn'

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      // Por defecto scroll horizontal; pero `overflow-x-auto` crea un contenedor de
      // scroll que rompe `position: sticky` en el thead. Quien quiera un thead sticky
      // pasa `containerClassName="overflow-visible"`.
      className={cn('relative w-full', containerClassName ?? 'overflow-x-auto')}
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      // Sin `hover:` de serie: resaltar la fila al pasar el ratón es la señal de
      // "esto se puede pinchar", y en las tablas que NO navegan (editores de
      // línea, previews) prometía algo que no existía. Lo pone ResponsiveList
      // solo cuando la fila lleva a algún sitio.
      className={cn(
        'border-b transition-colors has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Aire entre columnas de CUALQUIER listado: padding lateral de cada celda, así
 * que la separación visible entre dos columnas es el doble de esto. Único sitio
 * donde se toca — cabecera y celdas lo comparten, y ResponsiveList (que monta
 * sobre estos primitivos) lo hereda. No lo pises con px-* por celda: rompe la
 * uniformidad; para estrechar una columna usa el ancho del campo.
 */
export const TABLE_CELL_X = 'px-4'

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        TABLE_CELL_X,
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        TABLE_CELL_X,
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }

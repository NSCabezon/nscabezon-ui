import { useEffect } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { useLabels, type Labels } from '../context/UiProvider'

export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  // `total` viene recortado por un tope de consulta y hay más resultados: el
  // rango lo dice («de los primeros N») en vez de dar N por total real.
  truncated?: boolean
  className?: string
  /** Textos propios; ganan al `UiProvider`. */
  labels?: Partial<Labels>
}

// Server-side pagination footer: first/prev, centered "from–to of total" range, next/last.
// Renders nothing when everything fits on a single page.
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  truncated,
  className,
  labels: labelsProp,
}: PaginationProps) {
  const labels = useLabels(labelsProp)

  // Auto-clamp: si el total encoge (borrado/archivado) y la página actual queda
  // fuera de rango, volvemos a la última válida. Sin esto la lista se quedaba
  // vacía y, con total <= pageSize, además sin controles para volver.
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const outOfRange = page > maxPage
  useEffect(() => {
    if (outOfRange) onPageChange(maxPage)
  }, [outOfRange, maxPage, onPageChange])

  if (total <= pageSize) return null

  const lastPage = Math.ceil(total / pageSize)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn('flex items-center justify-center gap-1 pt-2', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
        aria-label={labels.paginationFirst}
        title={labels.paginationFirst}
      >
        <ChevronsLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={labels.paginationPrev}
        title={labels.paginationPrev}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="px-2 text-sm text-muted-foreground tabular-nums">
        {truncated
          ? labels.paginationRangeTruncated(from, to, total)
          : labels.paginationRange(from, to, total)}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
        aria-label={labels.paginationNext}
        title={labels.paginationNext}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onPageChange(lastPage)}
        aria-label={labels.paginationLast}
        title={labels.paginationLast}
      >
        <ChevronsRight className="size-4" />
      </Button>
    </div>
  )
}

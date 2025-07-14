import * as React from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { cn } from '~/utils/cn'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  className,
  onSort,
  sortKey,
  sortDirection,
}: DataTableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return

    const key = column.key as string
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'

    onSort(key, direction)
  }

  const getCellValue = (row: T, column: Column<T>) => {
    const keys = (column.key as string).split('.')
    let value: any = row

    for (const key of keys) {
      value = value?.[key]
    }

    return value
  }

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {columns.map((column) => (
              <th
                key={column.key as string}
                className={cn(
                  'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
                  column.sortable && 'cursor-pointer select-none',
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <span className="inline-flex flex-col">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No results.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {columns.map((column) => {
                  const value = getCellValue(row, column)
                  return (
                    <td
                      key={column.key as string}
                      className={cn(
                        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, row) : value}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable, type Column }

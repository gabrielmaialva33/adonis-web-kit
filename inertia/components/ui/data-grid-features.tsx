import type { ReactTable, RowData, TableState } from '@tanstack/react-table'
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * Feature set shared by every data grid.
 *
 * TanStack Table v9 no longer ships every feature by default — each one has to
 * be opted into, and the resulting object becomes the `TFeatures` type argument
 * carried by `Table`, `Row`, `Column`, `Cell` & friends. Keeping a single set
 * here means the grid components can all agree on one `TFeatures`.
 */
export const dataGridFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,

  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),

  filterFns,
  sortFns,
})

export type DataGridFeatures = typeof dataGridFeatures

/**
 * The table instance handed around by the grid components.
 *
 * `useTable` returns a `ReactTable`, not a bare `Table` — only the former
 * carries the subscribed `state` (v9 dropped `getState()`).
 */
export type DataGridTable<TData extends RowData> = ReactTable<
  DataGridFeatures,
  TData,
  TableState<DataGridFeatures>
>

import { ComponentProps } from 'react'
import { SortingState, Row, Cell, ColumnDef, ColumnHelper } from '@tanstack/react-table'

type TableHeader = {
  label: string
  className?: string
  tooltip?: string
}
type CellRenderProps<TData, TValue> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  row: Row<TData>['original']
  index: number
  cell: Cell<TData, TValue>
}

type CellRenderFn<TData, TValue = unknown> = (
  props: CellRenderProps<TData, TValue>,
) => React.ReactNode

type TableColumn<TData, TValue> = (
  helper: ColumnHelper<TData>,
) => ColumnDef<TData, TValue>

type DataTableProps<TableData> = ComponentProps<'table'> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<TableData, any>[]
  data: TableData[]
  isLoading?: boolean
  isPlaceholderData?: boolean
  sorting?: SortingState
  onSortingChange?: (state: SortingState) => void
  actions?: (rowData: TableData) => React.ReactElement
  rowClick?: (row: Row<TableData>) => void
  headerClassName?: string
  bodyRowClassName?: string
}

export type { DataTableProps, TableColumn, CellRenderFn, CellRenderProps, TableHeader }

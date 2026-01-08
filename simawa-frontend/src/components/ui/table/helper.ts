import { AccessorFn, Cell, Row, SortingState } from '@tanstack/react-table'

export type TextAlignType = 'left' | 'center' | 'right'

type TableColumnSize = {
  width?: number
  maxWidth?: number
  minWidth?: number
}

export type CellRenderProps<TData, TValue> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  row: Row<TData>['original']
  index: number
  cell: Cell<TData, TValue>
}

export type CellRenderFn<TData, TValue = unknown> = (
  props: CellRenderProps<TData, TValue>,
) => React.ReactNode

type TableHeader = {
  label: string
  className?: string
  tooltip?: string
}

export type TableColumn<T> = {
  columnId: string
  accessor: AccessorFn<T>
  header?: TableHeader
  render?: CellRenderFn<T, unknown>
  size?: TableColumnSize
  enableSorting?: boolean
  className?: string
}

export type TableProps<TableData> = {
  columns: TableColumn<TableData>[]
  data: TableData[]
  rowHref?: (rowData: TableData) => string
  isLoading?: boolean
  isPlaceholderData?: boolean
  sorting?: SortingState
  onSortingChange?: (state: SortingState) => void
  actions?: (rowData: TableData) => React.ReactElement
}

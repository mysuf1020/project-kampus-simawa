import {
  useMemo,
  FC,
  PropsWithChildren,
  Children,
  isValidElement,
  ReactElement,
  cloneElement,
} from 'react'
import {
  createColumnHelper,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Table } from './table'
import { DataTableProps } from './types'

type DataTablePlaceholderProps = PropsWithChildren<{
  colSpan?: number
  className?: string
  bodyRowClassName?: string
}>
const DataTablePlaceholder: FC<DataTablePlaceholderProps> = ({
  children,
  colSpan,
  className,
}) => {
  return (
    <Table.Row className="hover:!bg-white !data-[state=selected]:bg-main-30">
      <Table.Cell colSpan={colSpan} className={className}>
        <div className="flex flex-col items-center justify-center">{children}</div>
      </Table.Cell>
    </Table.Row>
  )
}

const DataTable = <TableData,>(props: DataTableProps<TableData>) => {
  const {
    columns,
    data,
    sorting,
    onSortingChange,
    children,
    rowClick,
    headerClassName,
    bodyRowClassName,
    ...rest
  } = props
  const columnHelper = createColumnHelper<TableData>()

  const _columns = useMemo<ColumnDef<TableData>[]>(
    () => columns.map((column) => column(columnHelper)),
    [columns, columnHelper],
  )

  const table = useReactTable({
    columns: _columns,
    data: data ?? [],
    manualSorting: true,
    state: {
      sorting,
    },
    enableSortingRemoval: false,
    sortDescFirst: false,
    onSortingChange: (updater) => {
      const newSortingValue =
        updater instanceof Function ? sorting && updater(sorting) : updater
      if (onSortingChange && newSortingValue) onSortingChange(newSortingValue)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  const tableHeaders = table.getFlatHeaders()
  const tableRows = table.getRowModel().rows

  const placeholderItem = useMemo<
    ReactElement<DataTablePlaceholderProps> | undefined
  >(() => {
    const elements = Children.map(children, (child) => child)?.filter((child) => {
      return isValidElement<DataTablePlaceholderProps>(child)
    })

    return elements?.map((element) =>
      cloneElement<DataTablePlaceholderProps>(element, {
        key: element.key,
        colSpan: tableHeaders.length,
        className: 'h-[560px]',
      }),
    )?.[0]
  }, [children, tableHeaders.length])

  return (
    <Table {...rest}>
      <Table.Header>
        <Table.Row>
          {tableHeaders.map((header) => (
            <Table.Head
              key={header.id}
              className={cn(
                'px-4',
                header.column.id === 'actions' &&
                  'sticky z-20 right-[-10px] bg-neutral-30',
                headerClassName,
              )}
              style={{
                minWidth: header.getSize(),
                maxWidth: header.column.columnDef.maxSize,
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </Table.Head>
          ))}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {placeholderItem ||
          tableRows.map((row) => (
            <Table.Row
              key={row.id}
              onClick={() => rowClick?.(row)}
              className={cn(rowClick && 'cursor-pointer', bodyRowClassName)}
            >
              {row.getVisibleCells().map((cell) => (
                <Table.Cell
                  className={cn(
                    'px-4 py-3',
                    cell.column.id === 'actions' &&
                      'sticky z-10 right-[-10px] bg-inherit',
                  )}
                  key={cell.id}
                  style={{
                    minWidth: cell.column.getSize(),
                    maxWidth: cell.column.columnDef.maxSize,
                    minHeight: 56,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  )
}

DataTable.Placeholder = DataTablePlaceholder

export { DataTable, type DataTableProps }

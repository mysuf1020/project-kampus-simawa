'use client'

import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import React, { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TableProps } from './helper'
import { TableHeader, TableHeaderBorder } from './table-header'
// import { TableBody } from "./table-body";
import { TableData, TableDataBorder } from './table-data'
import { TableRow } from './table-row'
import style from './style.module.css'
import { TableLoading } from './table-loading'
import { Text } from '../typography/text'

function Table<TableData>(props: TableProps<TableData>) {
  const {
    columns,
    data,
    rowHref,
    isLoading,
    isPlaceholderData,
    sorting,
    onSortingChange,
    actions,
  } = props
  const columnHelper = createColumnHelper<TableData>()

  const mapColumns = React.useMemo(() => {
    const columnDefinitions: ColumnDef<TableData>[] = columns.map((column) =>
      columnHelper.accessor(column.accessor, {
        id: column.columnId,
        header: column.header?.label,
        enableSorting: column.enableSorting,
        cell: (cellProps) => {
          const { cell, row } = cellProps
          if (column.render) {
            return column.render({
              cell,
              row: row.original,
              value: cell.getValue(),
              index: row.index,
            })
          }
          return (
            <Text level="m" className={cn(['text-neutral-600', column.className])}>
              {String(cell.getValue())}
            </Text>
          )
        },
      }),
    )

    return columnDefinitions
  }, [columnHelper, columns])

  const table = useReactTable({
    data: data ?? [],
    columns: mapColumns,
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

  const tableHeader = table.getFlatHeaders()
  const tableRow = table.getRowModel().rows
  const tableRef = useRef<HTMLDivElement>(null)
  const [initTableWidth, setInitTableWidth] = useState(0)
  const [tableWidth, setTableWidth] = useState(0)

  useLayoutEffect(() => {
    const tableWidthRef = tableRef.current
    if (!tableWidthRef) return

    const getTableWidth = () => {
      const scrollWidth = tableWidthRef.scrollWidth - tableWidthRef.scrollLeft
      const offsetWidth = tableWidthRef.offsetWidth
      const width = scrollWidth - offsetWidth
      setInitTableWidth(width)
    }

    getTableWidth()
    window.addEventListener('resize', getTableWidth)
    return () => window.removeEventListener('resize', getTableWidth)
  }, [tableRef])

  useLayoutEffect(() => {
    if (!tableRef.current || !initTableWidth) return

    const container = tableRef.current
    const updateTableWidth = () => {
      if (tableRef.current) {
        const { scrollLeft } = tableRef.current
        setTableWidth(initTableWidth - scrollLeft)
      }
    }

    updateTableWidth()
    container.addEventListener('scroll', updateTableWidth)
    return () => {
      container.removeEventListener('scroll', updateTableWidth)
    }
  }, [initTableWidth])

  return (
    <div className="w-full overflow-auto" ref={tableRef}>
      <div
        className="w-auto sm:w-full"
        style={{
          display: 'grid',
          justifyContent: 'space-between',
          gridTemplateColumns: `repeat(${mapColumns.length}, minmax(max-content, max-content))`,
        }}
      >
        {tableHeader.map((header) => (
          <TableHeader key={header.id} header={header} />
        ))}
        <TableHeaderBorder />
        {isLoading && <TableLoading tableHeader={tableHeader} />}
        {!isLoading &&
          tableRow.map((row, rowIndex) => {
            const href = rowHref && rowHref(data[row.index])
            return (
              <React.Fragment key={row.id}>
                {/* Row data */}
                <TableRow className={style['table-row']}>
                  {row.getVisibleCells().map((cell) => (
                    <TableData
                      key={cell.id}
                      cell={cell}
                      href={href}
                      tableWidth={tableWidth}
                      className={cn(
                        style['table-cell'],
                        isPlaceholderData && 'opacity-30',
                      )}
                      actions={actions && actions(data[row.index])}
                    />
                  ))}
                  <div
                    className={cn(style['table-row-overlay'])}
                    style={{ gridRowStart: row.index + 2 + row.index * 2 }}
                  >
                    {href && <Link href={href} className="w-full h-full block" />}
                  </div>
                </TableRow>

                {/* Row border */}
                {rowIndex < tableRow.length && rowIndex > 0 && (
                  <TableDataBorder rowIndex={rowIndex} />
                )}
              </React.Fragment>
            )
          })}
      </div>
    </div>
  )
}

export { Table }

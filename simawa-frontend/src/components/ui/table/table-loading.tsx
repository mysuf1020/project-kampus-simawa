import { Header } from '@tanstack/react-table'
import React from 'react'
import style from './style.module.css'
import { TableRow } from './table-row'
import { TableDataBorder } from './table-data'
import { Skeleton } from '../skeleton'

function TableLoading<T>({ tableHeader }: { tableHeader: Header<T, unknown>[] }) {
  const placeholderLength = 10
  return Array(placeholderLength)
    .fill('')
    .map((_, index) => (
      <React.Fragment key={index}>
        {/* Row data */}
        <TableRow className={style['table-row']}>
          {tableHeader.map((cell) => (
            <div
              key={cell.id}
              className="w-full py-4"
              style={{
                opacity: Number((1 - index * 0.1).toFixed(1)),
                gridArea: `${index + 2 + index * 2} / ${cell.column.getIndex() + 1}`,
              }}
            >
              <Skeleton />
            </div>
          ))}
        </TableRow>

        {/* Row border */}
        {index < placeholderLength && <TableDataBorder rowIndex={index} />}
      </React.Fragment>
    ))
}

export { TableLoading }

import { Cell, flexRender } from '@tanstack/react-table'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import style from './style.module.css'

type TableDataProps<TableData, TValue> = {
  cell: Cell<TableData, TValue>
  href?: string
  className?: string
  tableWidth?: number
  actions?: React.ReactElement
}

function TableData<TableData, TValue>({
  cell,
  href,
  className,
  actions,
  tableWidth,
}: TableDataProps<TableData, TValue>) {
  let wrapper
  const hasAction =
    cell.column.getIndex() === cell.row.getAllCells().length - 1 && actions

  const content = (
    <div className={cn('py-4 px-4 flex', hasAction && 'pr-12')}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
      {hasAction && (
        <div className={cn(style['table-action'])} style={{ right: tableWidth || 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
  if (href) {
    wrapper = <Link href={href}>{content}</Link>
  } else {
    wrapper = <div>{content}</div>
  }
  return (
    <div
      className={cn(className)}
      style={{
        gridArea: `${cell.row.index + 2 + cell.row.index * 2} / ${cell.column.getIndex() + 1}`,
      }}
    >
      {wrapper}
    </div>
  )
}

function TableDataBorder({ rowIndex }: { rowIndex: number }) {
  return (
    <div
      className="h-[1px] relative z-10 border-b border-border-tertiary col-start-1 col-end-[-1]"
      style={{ gridRowStart: rowIndex + 2 + rowIndex * 2 }}
    />
  )
}

export { TableData, TableDataBorder }

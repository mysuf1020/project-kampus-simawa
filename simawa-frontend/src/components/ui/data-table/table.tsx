'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TableBody } from './table-body'
import { TableHead } from './table-head'
import { TableHeader } from './table-header'
import { TableFooter } from './table-footer'
import { TableRow } from './table-row'
import { TableCell } from './table-cell'
import { TableCaption } from './table-caption'

interface TableComponent extends React.FC<React.ComponentProps<'table'>> {
  Body: typeof TableBody
  Header: typeof TableHeader
  Head: typeof TableHead
  Footer: typeof TableFooter
  Row: typeof TableRow
  Cell: typeof TableCell
  Caption: typeof TableCaption
}

const Table: TableComponent = ({ className, ...props }) => {
  return (
    <table
      data-slot="table"
      className={cn(
        'w-full caption-bottom text-sm border-separate border-spacing-0',
        className,
      )}
      {...props}
    />
  )
}

Table.Header = TableHeader
Table.Head = TableHead
Table.Body = TableBody
Table.Row = TableRow
Table.Cell = TableCell
Table.Footer = TableFooter
Table.Caption = TableCaption

export { Table }

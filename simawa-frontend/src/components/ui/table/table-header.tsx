import { Header, flexRender } from '@tanstack/react-table'
import Icon from '@/components/icons'
import { Text } from '../typography/text'

function TableHeader<TableData, TValue>({
  header,
}: {
  header: Header<TableData, TValue>
}) {
  const { column } = header
  const enableSorting = column.columnDef.enableSorting
  return (
    <div
      className="py-2 px-4 flex gap-1 items-center"
      style={{
        gridArea: `1 / ${header.index + 1}`,
      }}
    >
      <Text strong className="text-neutral-600 whitespace-nowrap">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </Text>
      {enableSorting && (
        <button
          className="hover:cursor-pointer"
          onClick={() => {
            column.toggleSorting()
          }}
        >
          {{
            asc: (
              <div className="text-brand-400 rounded bg-brand-50 p-0.5">
                <Icon name="ArrowDownOutlined" size={14} />
              </div>
            ),
            desc: (
              <div className="text-brand-400 rounded bg-brand-50 p-0.5">
                <Icon name="ArrowUpOutlined" size={14} />
              </div>
            ),
          }[header.column.getIsSorted() as string] ?? (
            <Icon name="ArrowDownOutlined" size={14} />
          )}
        </button>
      )}
    </div>
  )
}

function TableHeaderBorder() {
  return (
    <div
      className="h-[1px] relative z-10 border-b border-border col-start-1 col-end-[-1] "
      style={{ gridRowStart: 2 }}
    />
  )
}

export { TableHeader, TableHeaderBorder }

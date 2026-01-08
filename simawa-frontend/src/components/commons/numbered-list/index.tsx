import {
  FC,
  ReactNode,
  Children,
  useMemo,
  cloneElement,
  isValidElement,
  ReactElement,
  PropsWithChildren,
} from 'react'
import { Flex } from '@/components/ui'
import { cn } from '@/lib/utils'
import { NumberedItem, NumberedItemProps } from './numbered-item'

type NumberedListProps = PropsWithChildren<{
  header?: ReactNode
  className?: string
}>

interface NumberedListComponent extends FC<NumberedListProps> {
  Item: typeof NumberedItem
}

const NumberedList: NumberedListComponent = ({ header, children, className }) => {
  const numberedItems = useMemo<ReactElement<NumberedItemProps>[] | undefined>(() => {
    const _items = Children.map(children, (child) => child)?.filter((el) =>
      isValidElement<NumberedItemProps>(el),
    )

    return (
      _items?.map((item) => cloneElement<NumberedItemProps>(item, { key: item.key })) ??
      []
    )
  }, [children])
  return (
    <Flex direction="col" gap="6" className={cn('w-full', className)}>
      <div className="text-base font-medium">{header}</div>
      {numberedItems?.map((numberedItem, i) => (
        <Flex direction="row" gap="3" alignItems="start" key={i}>
          <div className="min-w-6 min-h-4 rounded-xl bg-neutral-100 text-neutral-700 flex flex-row justify-center items-center">
            <span className="block">{i + 1}</span>
          </div>
          <Flex direction="col" gap="2" className="text-[13px]">
            {numberedItem}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

NumberedList.Item = NumberedItem

export { NumberedList }

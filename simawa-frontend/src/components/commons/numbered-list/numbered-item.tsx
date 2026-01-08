import { FC, PropsWithChildren } from 'react'
type NumberedItemProps = PropsWithChildren<{
  className?: string
}>

const NumberedItem: FC<NumberedItemProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>
}

export { NumberedItem, type NumberedItemProps }

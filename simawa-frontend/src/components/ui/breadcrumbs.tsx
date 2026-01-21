import Link from 'next/link'
import {
  FC,
  PropsWithChildren,
  Children,
  isValidElement,
  ReactNode,
  cloneElement,
  Fragment,
  useCallback,
  useMemo,
  JSX,
} from 'react'
import { cn } from '@/lib/utils'
import { Text } from './typography/text'
import Icon from '../icons'

type BreadcrumbItemProps = PropsWithChildren<{
  href?: string
  onClick?: () => void
}>

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({ children, href, onClick }) => {
  return (
    <span className={cn(href || onClick ? 'text-text-link' : 'text-text-primary')}>
      {children}
    </span>
  )
}

type BreadcrumbProps = {
  children: ReactNode
  className?: string
}

interface BreadcrumbComponent extends FC<BreadcrumbProps> {
  Item: typeof BreadcrumbItem
}

const Breadcrumb: BreadcrumbComponent = ({ children, className }) => {
  const breadcrumbItems = useMemo<
    React.ReactElement<BreadcrumbItemProps>[] | undefined
  >(() => {
    const elements = Children.map(children, (child) => child)?.filter((child) => {
      return isValidElement<BreadcrumbItemProps>(child)
    })

    return elements?.map((element) =>
      cloneElement<BreadcrumbItemProps>(element, { key: element.key }),
    )
  }, [children])

  const renderItem = useCallback<
    (item: JSX.Element, href?: string, onClick?: () => void) => ReactNode
  >((item, href, onClick) => {
    if (onClick) {
      return (
        <div onClick={onClick}>
          <Text className="text-blue-500 hover:cursor-pointer">{item}</Text>
        </div>
      )
    }
    if (href) {
      return (
        <Link href={href} className="cursor-pointer">
          {item}
        </Link>
      )
    }

    return item
  }, [])

  return (
    <div className={cn('flex flex-row items-center gap-x-1', className)}>
      {breadcrumbItems?.map((item, i) =>
        i > 0 && i <= breadcrumbItems.length - 1 ? (
          <Fragment key={i}>
            <div>
              <Icon name="ChevronRightOutlined" size={16} className="text-icon-primary" />
            </div>
            <div key={i} className="text-sm text-text-primary font-medium">
              {renderItem(item, item.props.href, item.props.onClick)}
            </div>
          </Fragment>
        ) : (
          <div key={i} className="text-sm text-text-primary font-medium">
            {renderItem(item, item.props.href, item.props.onClick)}
          </div>
        ),
      )}
    </div>
  )
}

Breadcrumb.Item = BreadcrumbItem

export default Breadcrumb

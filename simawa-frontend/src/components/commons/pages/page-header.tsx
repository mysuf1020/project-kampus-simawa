import { FC, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import { Container, Separator } from '@/components/ui'
import Breadcrumb from '@/components/ui/breadcrumbs'

type BreadcrumbProps = {
  onClick?: () => void
  href?: string
  children: string | React.ReactNode
}

type PageHeaderProps = PropsWithChildren<{
  className?: string
  breadcrumbs?: BreadcrumbProps[]
  separator?: boolean
}>

const PageHeader: FC<PageHeaderProps> = ({
  children,
  className,
  breadcrumbs,
  separator = true,
}) => {
  return (
    <div className={cn('mb-8 w-full', className)}>
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-4">
            {breadcrumbs.map((breadcrumb, index) => (
              <Breadcrumb.Item
                key={index}
                href={breadcrumb.href}
                onClick={breadcrumb.onClick}
              >
                {breadcrumb.children}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
        <div className="space-y-1">{children}</div>
      </Container>
      {separator && <Separator className="mt-6 opacity-50" />}
    </div>
  )
}

export { PageHeader }

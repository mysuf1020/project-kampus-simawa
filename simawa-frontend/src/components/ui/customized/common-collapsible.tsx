import { FC, PropsWithChildren, ReactNode, useState } from 'react'
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Flex,
} from '@/components/ui'
import Icon from '@/components/icons'
import { cn } from '@/lib/utils'

type CommonCollapsibleProps = PropsWithChildren<{
  title?: ReactNode
  appearedContent?: ReactNode
  className?: string
}>

const CommonCollapsible: FC<CommonCollapsibleProps> = ({
  children,
  title,
  appearedContent,
  className,
}) => {
  const [open, setOpen] = useState<boolean>(true)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('w-full', className)}>
      <Flex className="flex flex-col rounded-lg border border-border-tertiary gap-y-6">
        <Flex className="flex flex-row gap-x-3 items-center p-3">
          <div>
            <CollapsibleTrigger asChild>
              <Button variant="icon" className="border rounded-lg border-brand-500 w-9">
                <Icon
                  name={open ? 'ChevronUpOutlined' : 'ChevronDownOutlined'}
                  size={18}
                  className="text-brand-650"
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="text-lg font-semibold text-neutral-900">{title}</div>
        </Flex>
        {appearedContent && (
          <Flex direction="col" className="py-6 pr-6 pl-13.5">
            {appearedContent}
          </Flex>
        )}

        <CollapsibleContent>
          <Flex direction="col" gap="6" className="py-6 pr-6 pl-13.5">
            {children}
          </Flex>
        </CollapsibleContent>
      </Flex>
    </Collapsible>
  )
}

export { CommonCollapsible }

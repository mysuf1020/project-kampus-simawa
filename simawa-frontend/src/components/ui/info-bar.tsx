'use client'
import * as React from 'react'

import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Flex } from './layout/flex'
import Icon from '../icons'
import { IconNames } from '../icons/type'

const infoBarVariants = cva('', {
  variants: {
    type: {
      info: 'bg-blue-100',
      warning: 'bg-orange-100',
    },
    iconColor: {
      info: 'text-blue-500',
      warning: 'text-orange-500',
    },
    iconName: {
      info: 'InfoCircleFilled',
      warning: 'WarningCircleFilled',
    },
  },
})

type InfoBarProps = React.PropsWithChildren & {
  type: 'info' | 'warning'
  className?: string
}

const InfoBar = React.forwardRef<HTMLDivElement, InfoBarProps>(
  ({ type, children, className }, ref) => {
    const baseClass = `py-2 px-3 rounded`
    return (
      <Flex
        direction="row"
        alignItems="items-start"
        className={cn(baseClass, infoBarVariants({ type }), className)}
        ref={ref}
      >
        <span className={cn(infoBarVariants({ iconColor: type }), 'mr-1.5')}>
          <Icon name={infoBarVariants({ iconName: type }) as IconNames} size={18} />
        </span>
        {children}
      </Flex>
    )
  },
)

InfoBar.displayName = 'InfoBar'
export { InfoBar }

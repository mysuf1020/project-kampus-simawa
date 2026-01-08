import React, { CSSProperties, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type FlexGap =
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '4.5'
  | '5'
  | '5.5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'

type FlexProps = {
  direction?: 'row' | 'col'
  justifyContent?: CSSProperties['justifyContent']
  alignItems?: CSSProperties['alignItems']
  gap?: FlexGap
  className?: string
  style?: CSSProperties
}

const gapClass = {
  0.5: 'gap-0.5',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  2.5: 'gap-2.5',
  3: 'gap-3',
  3.5: 'gap-3.5',
  4: 'gap-4',
  4.5: 'gap-4.5',
  5: 'gap-5',
  5.5: 'gap-5.5',
  6: 'gap-6',
  7: 'gap-7',
  8: 'gap-8',
  9: 'gap-9',
  10: 'gap-10',
  11: 'gap-11',
  12: 'gap-12',
}

const Flex = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<FlexProps & React.HTMLAttributes<HTMLDivElement>>
>((props, ref) => {
  const {
    justifyContent,
    alignItems,
    children,
    direction = 'row',
    gap,
    className,
    style,
    ...divProps
  } = props
  return (
    <div
      className={cn(
        'flex',
        direction === 'col' && 'flex-col',
        gap && gapClass[gap],
        className,
      )}
      style={{
        justifyContent,
        alignItems,
        ...style,
      }}
      ref={ref}
      {...divProps}
    >
      {children}
    </div>
  )
})
Flex.displayName = 'Flex'

export { Flex }

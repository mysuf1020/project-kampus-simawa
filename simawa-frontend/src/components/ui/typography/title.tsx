import React, { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export type TitleProps = {
  level?:
    | 'd1'
    | 'd2'
    | 'd3'
    | 'd4'
    | 'd5'
    | 'd6'
    | 'd7'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
  className?: string
  asChild?: boolean
}

const titleClass = {
  d1: 'display-1',
  d2: 'display-2',
  d3: 'display-3',
  d4: 'display-4',
  d5: 'display-5',
  d6: 'display-6',
  d7: 'display-7',
  h1: 'heading-1',
  h2: 'heading-2',
  h3: 'heading-3',
  h4: 'heading-4',
  h5: 'heading-5',
  h6: 'heading-6',
}

const element = {
  d1: 'div',
  d2: 'div',
  d3: 'div',
  d4: 'div',
  d5: 'div',
  d6: 'div',
  d7: 'div',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
}

/**
 * d1 (display 1) = size 72px / line height 94px / font weight 600
 *
 * d2 (display 2) = size 64px / line height 82px / font weight 600
 *
 * d3 (display 3) = size 56px / line height 72px / font weight 600
 *
 * d4 (display 4) = size 48px / line height 62px / font weight 600
 *
 * d5 (display 5) = size 40px / line height 52px / font weight 600
 *
 * d6 (display 6) = size 32px / line height 42px / font weight 600
 *
 * d7 (display 7) = size 28px / line height 36px / font weight 600
 *
 * h1 (heading 1) = size 24px / line height 36px / font weight 600
 *
 * h2 (heading 2) = size 20px / line height 30px / font weight 600
 *
 * h3 (heading 3) = size 18px / line height 28px / font weight 600
 *
 * h4 (heading 4) = size 16px / line height 24px / font weight 600
 *
 * h5 (heading 5) = size 14px / line height 22px / font weight 600
 *
 * h6 (heading 6) = size 12px / line height 18px / font weight 600 / uppercase
 *
 */
export function Title({
  children,
  className,
  level = 'h1',
  asChild = false,
}: PropsWithChildren<TitleProps>) {
  //   return <p className={classname(style['en-text'], titleClass[level])}>{children}</p>;
  return React.createElement(
    asChild ? 'div' : element[level],
    {
      className: cn(titleClass[level], className),
    },
    children,
  )
}
Title.displayName = 'Title'

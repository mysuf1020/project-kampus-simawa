import { createElement, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export type TextProps = {
  level?: 'xl' | 'l' | 'm' | 's' | 'xs' | '2xs' | '3xs'
  strong?: boolean
  className?: string
  asSpan?: boolean
}

const fontSize = {
  xl: 'text-xl', // size: 18px; line height: 26px; weight: 400
  l: 'text-l', // size: 16px; line height: 24px; weight: 400
  m: 'text-m', // size: 14px; line height: 22px; weight: 400
  s: 'text-s', // size: 13px; line height: 20px; weight: 400
  xs: 'text-xs', // size: 12px; line height: 18px; weight: 400
  '2xs': 'text-2xs', // size: 11px; line height: 16px; weight: 400
  '3xs': 'text-3xs', // size: 10px; line height: 14px; weight: 400
}

/**
 * XL = 18px
 *
 * L = 16px
 *
 * M = 14px
 *
 * S = 13px
 *
 * XS = 12px
 *
 * 2XS = 11px
 *
 * 3XS = 10px
 *
 * Strong = weight 500
 */
export function Text({
  children,
  className = '',
  level = 'm',
  strong = false,
  asSpan = false,
}: PropsWithChildren<TextProps>) {
  return createElement(
    asSpan ? 'span' : 'div',
    {
      className:
        cn('bp-text', strong && 'font-medium', className) + ' ' + fontSize[level],
    },
    children,
  )
}
Text.displayName = 'Text'

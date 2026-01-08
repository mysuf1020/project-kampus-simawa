import { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import s from './skeleton.module.css'

function Skeleton({
  style,
  className,
  brand,
}: {
  style?: CSSProperties
  className?: string
  brand?: boolean
}) {
  return (
    <div className={cn(s['skeleton'], className, brand && s['brand'])} style={style} />
  )
}

function SkeletonCircle({ style }: { style?: CSSProperties }) {
  return <div className={cn(s['skeleton-circle'], 'hidden lg:block')} style={style} />
}

export { Skeleton, SkeletonCircle }

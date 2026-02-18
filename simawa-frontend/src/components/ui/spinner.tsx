import Image from 'next/image'
import { cn } from '@/lib/utils'
import { AnimationSpinner } from './animation-spinner'
import Icon from '../icons'

type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  screenOverlay?: boolean
  className?: string
}
const spinners = {
  xs: <Icon name="LoaderCircle" size={14} />,
  sm: <Icon name="LoaderCircle" size={16} />,
  md: <Icon name="LoaderCircle" size={20} />,
  lg: <Icon name="LoaderCircle" size={26} />,
  xl: <Icon name="LoaderCircle" size={36} />,
}

function Spinner({ size = 'md', screenOverlay, className }: SpinnerProps) {
  const classNames = {
    overlay: screenOverlay
      ? 'fixed bg-white top-0 bottom-0 flex flex-col gap-4 items-center justify-center left-0 right-0 pointer-events-none'
      : 'animate-spin inline-block',
  }
  return (
    <div className={cn(classNames.overlay, className)}>
      {screenOverlay && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-brand-600 font-bold text-2xl shadow-lg border border-brand-100/50">
            S
          </div>
          <div className="text-brand-900 font-bold tracking-tight">SIMAWA</div>
        </div>
      )}
      {screenOverlay ? <AnimationSpinner size={36} /> : spinners[size]}
    </div>
  )
}
Spinner.displayName = 'Spinner'

export { Spinner }

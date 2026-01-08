import { cn } from '@/lib/utils'

export const HamburgerButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean
  onClick: VoidFunction
}) => {
  return (
    <button id="hamburger-button" className={cn(isOpen && 'open')} onClick={onClick}>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </button>
  )
}

import { forwardRef, ComponentPropsWithoutRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type SearchableResultItemProps = ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean
}

const SearchableResultItem = forwardRef<HTMLDivElement, SearchableResultItemProps>(
  ({ children, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'
    return (
      <Comp
        {...props}
        ref={ref}
        className={cn(
          'cursor-pointer w-full hover:bg-blue-100 hover:text-main-500 px-2 py-1.5 text-sm rounded',
          className,
        )}
      >
        {children}
      </Comp>
    )
  },
)

SearchableResultItem.displayName = 'SearchableResultItem'

export { SearchableResultItem }

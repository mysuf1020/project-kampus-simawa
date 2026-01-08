import { cn } from '@/lib/utils'

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b [&_tr]:!bg-transparent', className)}
      {...props}
    />
  )
}

export { TableHeader }

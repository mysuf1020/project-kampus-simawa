import { cn } from '@/lib/utils'

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-main-30 data-[state=selected]:bg-main-30 bg-white transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export { TableRow }

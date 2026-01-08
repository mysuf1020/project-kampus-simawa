import { cn } from '@/lib/utils'

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        // "bg-blue-400",
        '[&_tr:first-child_td:first-child]:rounded-tl-xl',
        '[&_tr:first-child_td:last-child]:rounded-tr-xl',
        '[&_tr:last-child_td:first-child]:rounded-bl-xl',
        '[&_tr:last-child_td:last-child]:rounded-br-xl',
        // border bottom left border
        '[&_tr:last-child_td:first-child]:border-b [&_tr:last-child_td:first-child]:border-l [&_tr:last-child_td:first-child]:rounded-bl-xl',
        // border bottom right border
        '[&_tr:last-child_td:last-child]:border-b [&_tr:last-child_td:last-child]:border-r [&_tr:last-child_td:last-child]:rounded-br-xl',
        // border top left border
        '[&_tr:first-child_td:first-child]:border-t [&_tr:first-child_td:first-child]:border-l [&_tr:first-child_td:first-child]:rounded-tl-xl',
        // border top right border
        '[&_tr:first-child_td:last-child]:border-t [&_tr:first-child_td:last-child]:border-r [&_tr:first-child_td:last-child]:rounded-tr-xl',
        'border-b border-border-tertiary',
        // border-top,
        '[&_tr:first-child_td]:border-t',
        // border-left on the first td of each tr,
        '[&_tr_td:first-child]:border-l',
        // border-right on the last td of each tr,
        '[&_tr_td:last-child]:border-r',
        className,
      )}
      {...props}
    />
  )
}

export { TableBody }

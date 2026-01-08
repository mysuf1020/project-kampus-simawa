'use client'
import { JSX, ReactNode, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Spinner,
} from '@/components/ui'

export type ConfirmationDialogProps = {
  extraContent?: ReactNode
  onConfirm: () => void
  isLoading?: boolean
  withCancel?: boolean
  labels: {
    icon?: React.ReactElement
    title: JSX.Element | string
    description?: JSX.Element | string
    confirm?: JSX.Element | string
    cancel?: JSX.Element | string
  }
  open: boolean
  onOpenChange?: (open: boolean) => void
}

function ConfirmationDialog({
  onConfirm,
  open,
  onOpenChange,
  labels,
  withCancel = true,
}: ConfirmationDialogProps) {
  const { title, description, icon, confirm = 'OK', cancel = 'Cancel' } = labels
  const [isLoading, setLoading] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[360px] sm:w-[500px] z-1000">
        <AlertDialogHeader className="flex flex-col gap-4 -my-4 mt-0">
          {icon && <div className="flex justify-start">{icon}</div>}
          <AlertDialogTitle className="text-[28px]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-700">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {withCancel && <AlertDialogCancel>{cancel}</AlertDialogCancel>}
          <AlertDialogAction
            onClick={() => {
              setLoading(true)
              onConfirm()
              setLoading(false)
            }}
          >
            {isLoading && <Spinner />}
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmationDialog }

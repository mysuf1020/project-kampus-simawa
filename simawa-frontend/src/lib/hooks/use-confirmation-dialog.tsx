import React, { PropsWithChildren, useCallback, useContext } from 'react'
import {
  ConfirmationDialog,
  ConfirmationDialogProps,
} from '@/components/ui/confirmation-dialog'

type ConfirmationProps = Pick<
  ConfirmationDialogProps,
  'labels' | 'onConfirm' | 'withCancel'
>

const ConfirmationDialogContext = React.createContext<{
  confirm: (props: ConfirmationProps) => void
}>({
  confirm: () => {},
})
const ConfirmationDialogProvider = (props: PropsWithChildren) => {
  const defaultState = {
    onConfirm: () => {},
    labels: {
      title: '',
    },
  }
  const [confimationProps, setConfirmationProps] =
    React.useState<ConfirmationProps>(defaultState)
  const [open, setOpen] = React.useState(false)

  const confirm = useCallback(({ labels, onConfirm, withCancel }: ConfirmationProps) => {
    setConfirmationProps({
      labels,
      onConfirm,
      withCancel,
    })
    setOpen(true)
  }, [])
  return (
    <ConfirmationDialogContext.Provider value={{ confirm }}>
      {props.children}
      <ConfirmationDialog
        open={open}
        labels={confimationProps.labels}
        onConfirm={confimationProps.onConfirm}
        withCancel={confimationProps.withCancel}
        onOpenChange={(open) => {
          setOpen(open)
        }}
      />
    </ConfirmationDialogContext.Provider>
  )
}
const useConfirmationDialog = () => {
  return useContext(ConfirmationDialogContext)
}

export { useConfirmationDialog, ConfirmationDialogProvider }

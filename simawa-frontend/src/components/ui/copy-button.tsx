import { MouseEvent } from 'react'
import { toast } from 'sonner'
import Icon from '@/components/icons'
import { Button } from './button'

function CopyButton({ copyValue }: { copyValue: string }) {
  const onCopyClicked = (e: MouseEvent<HTMLButtonElement>) => {
    navigator.clipboard.writeText(copyValue).then(() => {
      toast.success('Berhasil disalin ke clipboard')
    })
    e.stopPropagation()
  }

  return (
    <Button variant="icon" onClick={onCopyClicked}>
      <Icon name="CopyRoundedOutlined" size={18} className="text-blue-500" />
    </Button>
  )
}

export { CopyButton }

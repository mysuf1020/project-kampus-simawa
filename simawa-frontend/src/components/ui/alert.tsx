import React, { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import { Text } from './typography/text'
import Icon from '../icons'

type AlertProps = {
  type?: 'info' | 'error' | 'warning'
  closable?: boolean
}

const bgClass = {
  info: 'bg-blue-50 text-neutral-900',
  error: 'bg-red-50 text-red-900',
  warning: 'bg-orange-100 text-neutral-900',
}

function Alert(props: PropsWithChildren<AlertProps>) {
  const { children, type = 'info', closable = false } = props
  const [open, setOpen] = React.useState(true)

  const handleVisibility = () => setOpen((open) => !open)

  if (closable && !open) return null
  return (
    <div className={cn('flex items-center gap-1.5 rounded-sm py-2 px-3', bgClass[type])}>
      {type === 'info' && <Icon name="InfoCircleOutlined" size={18} />}
      {type === 'error' && (
        <Icon name="WarningCircleOutlined" className="text-red-300" size={20} />
      )}
      {type === 'warning' && (
        <Icon name="WarningCircleFilled" className="text-orange-500" size={18} />
      )}
      <Text level="m" className="flex-1">
        {children}
      </Text>
      {closable && (
        <button type="button" onClick={handleVisibility}>
          <Icon name="CloseOutlined" size={18} />
        </button>
      )}
    </div>
  )
}

export { Alert }

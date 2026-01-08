import { PropsWithChildren } from 'react'
import { Flex, Spinner, Text } from '@/components/ui'
import Icon from '@/components/icons'

export type LabeledProps = {
  required?: boolean
  label?: string
  className?: string
  error?: boolean
  showError?: boolean
  isLoading?: boolean
}

export function Labeled({
  children,
  label = '',
  required = false,
  error = false,
  isLoading = false,
  className,
}: PropsWithChildren<LabeledProps>) {
  return (
    <Flex direction="col" gap="2" className={className}>
      <Text className="text-neutral-700 font-semibold">
        <span className="inline-flex items-center gap-1">
          {label}
          {required && <span className="text-red-600">*</span>}
          {isLoading && <Spinner size="sm" />}
          {error && !isLoading && (
            <Icon name="WarningCircleFilled" size={18} className="text-red-600" />
          )}
        </span>
      </Text>
      {children}
    </Flex>
  )
}

Labeled.displayName = 'Labeled'

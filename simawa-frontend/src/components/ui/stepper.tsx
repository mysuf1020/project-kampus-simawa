import React from 'react'
import { cn } from '@/lib/utils'
import Icon from '../icons'
import { Text } from '.'

interface StepperProps {
  steps: {
    id: string
    label: string
  }[]
  current: number
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn(className)}>
      {/* MOBILE */}
      <div className="flex sm:hidden gap-1.5 -ml-4 -mr-4">
        {steps.map((step, index) => {
          const isActive = current === index
          const isComplete = current > index
          const bgClass = isActive || isComplete ? 'bg-main-500' : 'bg-neutral-300'

          return (
            <div
              key={step.id}
              className={cn('flex flex-1 items-center gap-1.5 whitespace-nowrap')}
            >
              <div className={cn('h-1 w-full', bgClass)} />
            </div>
          )
        })}
      </div>

      {/* DESKTOP */}
      <div className="hidden sm:flex gap-1.5 justify-start">
        {steps.map((step, index) => {
          const isActive = current === index
          const isComplete = current > index
          const bgClass = isActive
            ? 'bg-main-500 outline-2 outline-main-500 outline-offset-2'
            : 'bg-neutral-100 border border-neutral-300'

          return (
            <div
              key={step.id}
              className={cn('flex items-center gap-1 whitespace-nowrap')}
            >
              {isComplete ? (
                <Icon name="CheckCircleFilled" size={20} className="text-green-600" />
              ) : (
                <div className={cn(bgClass, 'w-2 h-2 rounded-full mr-1')} />
              )}
              <Text
                level="m"
                className={cn(
                  isComplete ? 'text-green-600 font-semibold' : 'text-neutral-700',
                  isActive && 'text-main-500 font-semibold',
                )}
              >
                {step.label}
              </Text>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'min-h-[1px] min-w-12 bg-neutral-300 mr-2',
                    'border-solid',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

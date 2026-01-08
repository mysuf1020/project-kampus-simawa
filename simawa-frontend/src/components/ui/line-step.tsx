import React from 'react'
import { cn } from '@/lib/utils'

interface LineStepProps {
  steps: {
    id: string
    content: React.ReactElement
  }[]
  current: string
}

function LineStep({ steps, current }: LineStepProps) {
  const activeIndex = steps.findIndex((step) => step.id === current)

  return (
    <>
      <div className="flex gap-1 justify-stretch">
        {steps.map((step, index) => {
          const isActive = current === step.id
          const isComplete = activeIndex > index
          const bgClass = isActive || isComplete ? 'bg-brand-500' : 'bg-neutral-100'

          return <div key={step.id} className={cn('h-1.5 w-full', bgClass)} />
        })}
      </div>
      {steps[activeIndex].content}
    </>
  )
}

export { LineStep }

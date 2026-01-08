import { FC, PropsWithChildren, ReactNode, useMemo } from 'react'
import { cva } from 'class-variance-authority'
import Icon from '@/components/icons'

const stepperItemVariants = cva('text-[13px] font-medium', {
  variants: {
    variant: {
      active: 'text-brand-600',
      inactive: 'text-neutral-900',
      passed: 'text-green-600',
    },
  },
})

type StepperItemProps = PropsWithChildren<{
  variant: 'active' | 'inactive' | 'passed'
}>

const StepperItem: FC<StepperItemProps> = ({ variant, children }) => {
  const classToApply = stepperItemVariants({ variant })

  const bullet = useMemo<ReactNode>(() => {
    switch (variant) {
      case 'active':
        return (
          <div className="w-4 h-4 p-0.5 inline-block bg-transparent border-[2px] rounded-xl border-brand-550">
            <div className="block w-full h-full bg-brand-550 rounded-xl">&nbsp;</div>
          </div>
        )
      case 'inactive':
        return <div className="w-4 h-4 bg-neutral-200 rounded-xl">&nbsp;</div>
      case 'passed':
        return (
          <div>
            <Icon name="CheckCircleFilled" size={16} className="text-green-500" />
          </div>
        )
    }
  }, [variant])

  return (
    <div className="flex flex-row items-center gap-x-1.5">
      {bullet}
      <div className={classToApply}>{children}</div>
    </div>
  )
}

export { StepperItem, type StepperItemProps }

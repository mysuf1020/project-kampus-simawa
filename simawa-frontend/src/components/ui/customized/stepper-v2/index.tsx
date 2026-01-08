import {
  FC,
  PropsWithChildren,
  Children,
  useMemo,
  isValidElement,
  cloneElement,
  Fragment,
} from 'react'
import { StepperItem, type StepperItemProps } from './stepper-item'

type StepperV2Props = PropsWithChildren

interface StepperComponent extends FC<StepperV2Props> {
  Item: typeof StepperItem
}

const StepperV2: StepperComponent = ({ children }) => {
  const stepperItems = useMemo<React.ReactElement<StepperItemProps>[] | undefined>(() => {
    const elements = Children.map(children, (child) => child)?.filter((child) => {
      return isValidElement<StepperItemProps>(child)
    })

    return elements?.map((element) =>
      cloneElement<StepperItemProps>(element, { key: element.key }),
    )
  }, [children])

  return (
    <div className="flex flex-row items-center gap-x-2">
      {stepperItems?.map((item, i) =>
        i > 0 && i <= stepperItems.length - 1 ? (
          <Fragment key={i}>
            <div className="inline-block w-10 h-0.5 border-t border-t-neutral-500" />
            {item}
          </Fragment>
        ) : (
          item
        ),
      )}
    </div>
  )
}

StepperV2.Item = StepperItem

export { StepperV2 }

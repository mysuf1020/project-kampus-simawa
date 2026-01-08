import { FC, PropsWithChildren, Fragment } from 'react'

type RequiredProps = PropsWithChildren<{
  className?: string
}>

const Required: FC<RequiredProps> = ({ children, className }) => {
  return (
    <>
      <span className={className}>{children}</span>
      <span className="text-red-600">
        <sup>&#42;</sup>
      </span>
    </>
  )
}

export { Required }

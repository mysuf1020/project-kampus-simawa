import { FC, PropsWithChildren } from 'react'

const TableBody: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="relative rounded-lg border bg-border-tertiary col-start-1 col-end-[-1]">
      {children}
    </div>
  )
}

export { TableBody }

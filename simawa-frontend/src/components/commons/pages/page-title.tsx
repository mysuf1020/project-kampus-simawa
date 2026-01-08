import { FC, PropsWithChildren } from 'react'

const PageTitle: FC<PropsWithChildren> = ({ children }) => {
  return <div className="text-[28px] font-medium mt-4">{children}</div>
}

export { PageTitle }

import { FC, PropsWithChildren } from 'react'
import { Container } from './layout/container'

const StickyButtonContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="fixed py-4 border-t bottom-0 right-0 w-(--main-layout-width) z-[900] bg-background-neutral-subtle">
      <Container>{children}</Container>
    </div>
  )
}

export { StickyButtonContainer }

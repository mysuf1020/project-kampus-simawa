import { FC, PropsWithChildren } from 'react'

import { PageHeader } from './page-header'
import { PageTitle } from './page-title'
import { PageBody } from './page-body'
import { PageSection } from './page-section'

interface PageComponent extends FC<PropsWithChildren> {
  Header: typeof PageHeader
  Title: typeof PageTitle
  Body: typeof PageBody
  Section: typeof PageSection
}

const Page: PageComponent = ({ children }) => {
  return <div className="flex flex-col min-h-full">{children}</div>
}

Page.Header = PageHeader
Page.Title = PageTitle
Page.Body = PageBody
Page.Section = PageSection

export { Page }

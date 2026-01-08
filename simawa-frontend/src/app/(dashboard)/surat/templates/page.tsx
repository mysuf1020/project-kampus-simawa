'use client'

import { Page } from '@/components/commons'
import { Container } from '@/components/ui'
import { TemplateBuilder } from '../_components/template-builder'

export default function SuratTemplatesPage() {
  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/surat', children: 'Surat' }, { href: '/surat/templates', children: 'Template' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Template Surat
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Buat dan kelola template surat dengan mudah menggunakan form builder.
            </p>
          </div>
        </div>
      </Page.Header>
      <Page.Body>
        <Container>
          <TemplateBuilder />
        </Container>
      </Page.Body>
    </Page>
  )
}

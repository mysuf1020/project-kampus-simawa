/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useConfirmationDialog } from '@/lib/hooks/use-confirmation-dialog'
import { Title } from '@/components/ui/typography/title'
import { Text } from '@/components/ui/typography/text'
import Icon from '../icons'

type FormLeaveDialogProps = {
  isDirty: boolean
}

const FormLeaveDialog = ({ isDirty }: FormLeaveDialogProps) => {
  const { confirm } = useConfirmationDialog()
  const router = useRouter()

  const showConfirmation = React.useCallback(
    (href: string | null) => {
      confirm({
        onConfirm: () => {
          if (href) {
            router.push(href)
          }
        },
        labels: {
          title: (
            <Title level="h2" asChild>
              Tinggalkan Halaman?
            </Title>
          ),
          description: (
            <Text className="text-left text-neutral-700" asSpan>
              Anda memiliki perubahan yang belum disimpan dan mungkin hilang. Apakah Anda
              yakin ingin meninggalkan halaman ini? Tindakan ini tidak dapat dibatalkan.
            </Text>
          ),
          icon: <Icon name="WarningCircleOutlined" size={54} className="text-red-500" />,
          confirm: 'Tinggalkan Halaman',
        },
      })
    },
    [confirm, router],
  )

  React.useEffect(() => {
    const handleEventListener = (e: MouseEvent) => {
      e.preventDefault()
      let href = null
      if (e.currentTarget instanceof HTMLAnchorElement) {
        href = e.currentTarget.getAttribute('href')
      }
      showConfirmation(href)
    }
    const beforeUnloadHandler = (event: any) => {
      event.preventDefault()
      event.returnValue = true
    }

    const links = document.querySelectorAll('a')

    if (isDirty) {
      window.addEventListener('beforeunload', beforeUnloadHandler)
      links.forEach((el) => {
        el.addEventListener('click', handleEventListener)
      })
    } else {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      links.forEach((el) => {
        el.removeEventListener('click', handleEventListener)
      })
    }

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      links.forEach((el) => {
        el.removeEventListener('click', handleEventListener)
      })
    }
  }, [isDirty, showConfirmation])

  return null
}

export { FormLeaveDialog }

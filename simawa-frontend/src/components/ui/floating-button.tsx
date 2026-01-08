'use client'

import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import Icon from '../icons'

export const FloatingButton: React.FC<{ href: string; label?: string }> = ({
  href,
  label,
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }
  return createPortal(
    <Link
      href={href}
      className={cn(
        'fixed bottom-20 right-4 z-[99] shadow bg-main-500 text-white w-14 h-14 rounded-full flex sm:hidden items-center justify-center',
        label && 'w-auto h-auto px-4 gap-2 py-2',
      )}
    >
      <Icon name="PlusOutlined" size={label ? 18 : undefined} />
      {label}
    </Link>,
    document.body,
  )
}

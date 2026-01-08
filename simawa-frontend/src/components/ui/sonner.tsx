'use client'

import { Toaster as Sonner } from 'sonner'

const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      theme="light"
      richColors
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg shadow-md border border-neutral-200 bg-white text-neutral-900',
          title: 'font-semibold',
        },
      }}
    />
  )
}

export { Toaster }

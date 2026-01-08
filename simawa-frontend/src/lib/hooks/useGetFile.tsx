// Legacy hook; kept as no-op to avoid TypeScript errors.
import { useEffect, useState } from 'react'

export function useGetFile(name?: string, open: boolean = true) {
  const [fileUrl, setFileUrl] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [isError, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open || !name) return
    setLoading(false)
    setFileUrl('')
    setError(undefined)
  }, [open, name])

  return { fileUrl, isLoading, isError }
}

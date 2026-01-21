'use client'

import React from 'react'
import { Spinner } from './spinner'

export function InfiniteScrollLoader({
  onLoadMore,
  isLoading,
  hasMore = true,
}: {
  onLoadMore: () => void
  isLoading?: boolean
  hasMore?: boolean
}) {
  const loaderRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = loaderRef.current
    if (!element || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore()
        }
      },
      { threshold: 0.5, rootMargin: '100px' },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [isLoading, onLoadMore, hasMore])

  if (!hasMore) return null

  return (
    <div ref={loaderRef} className="flex justify-center items-center py-6 w-full">
      {isLoading && <Spinner size="md" />}
    </div>
  )
}

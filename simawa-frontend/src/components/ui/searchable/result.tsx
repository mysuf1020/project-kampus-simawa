import { CSSProperties, ReactElement } from 'react'
import { useSearchableQuery, useSearchableResult } from './context'

type SearchableRenderParams<QResult> = {
  isLoading: boolean
  result?: QResult
  error?: unknown
}

type SearchableResultRenderFn<QResult = unknown> = (
  result: SearchableRenderParams<QResult>,
) => ReactElement<SearchableResultProps<QResult>>

type SearchableResultProps<QResult> = {
  render: SearchableResultRenderFn<QResult>
  style?: CSSProperties
  className?: string
}

function SearchableResult<QResult = unknown>({
  render,
  style,
  className,
}: SearchableResultProps<QResult>) {
  const { searchQuery } = useSearchableQuery<unknown>()
  const { isLoading, data: result, error } = useSearchableResult<QResult>()
  return (
    searchQuery !== undefined &&
    (result !== undefined || isLoading || (error !== undefined && error !== null)) && (
      <div style={style} className={className}>
        {render({ isLoading, result, error })}
      </div>
    )
  )
}

export { SearchableResult, type SearchableRenderParams }

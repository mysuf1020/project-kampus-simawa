'use client'

import { useEffect, useState } from 'react'
import useDebounce from '@/lib/hooks/use-debounce'
import { Input, InputProps } from './input'
import Icon from '../icons'

type InputSearchProps = {
  defaultValue?: string
  placeholder?: string
  className?: string
  value?: string
  onSearch: (value: string) => void
  inputSize?: InputProps['inputSize']
}

export default function InputSearch({
  onSearch,
  placeholder,
  className,
  value = '',
  inputSize = 'default',
}: InputSearchProps) {
  const [search, setSearch] = useState(value)
  const { value: debounceValue } = useDebounce({ value: search })

  useEffect(() => {
    onSearch(debounceValue)
  }, [onSearch, debounceValue])

  return (
    <Input
      className={className}
      inputSize={inputSize}
      prefix={<Icon name="SearchOutlined" className="text-neutral-600" size={16} />}
      suffix={
        value ? (
          <button className="px-2 text-neutral-600" onClick={() => setSearch('')}>
            <Icon name="CloseOutlined" size={14} />
          </button>
        ) : (
          <div></div>
        )
      }
      placeholder={placeholder}
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
      }}
    />
  )
}

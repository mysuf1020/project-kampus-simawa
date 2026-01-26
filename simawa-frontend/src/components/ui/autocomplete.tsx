'use client'

import * as React from 'react'

import { PopoverAnchor } from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'
import { Input, InputProps } from './input'
import { Flex } from './layout/flex'
import { Text } from './typography/text'
import { Popover, PopoverContent } from './popover'
import Icon from '../icons'

type AutoCompleteOption<TData = unknown> = {
  value: string
  label: string
} & TData

type AutoCompleteProps<TData = unknown> = Omit<InputProps, 'onSelect'> & {
  options: AutoCompleteOption<TData>[]
  searchValue?: string
  onSelect: (value?: string, selectedOption?: AutoCompleteOption<TData>) => void
  value?: string
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
  popoverClassName?: string
  onSearch?: (searchText: string) => void
  customRender?: (option: AutoCompleteOption<TData>) => React.ReactNode
  hasNextPage?: boolean
  onFetchNextPage?: () => void
  isFetchingNextPage?: boolean
  isPlaceholderData?: boolean
  optionSuffix?: React.ReactElement
  closable?: boolean
  onRemove?: () => void
}

export function AutoComplete<TData>({
  placeholder,
  options,
  onSelect,
  onSearch,
  customRender,
  disabled,
  isLoading,
  value,
  className,
  onBlur,
  onFocus,
  hasNextPage,
  onFetchNextPage,
  isFetchingNextPage,
  isPlaceholderData,
  optionSuffix,
  closable,
  searchValue,
  onRemove,
}: AutoCompleteProps<TData>) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  // Find the currently selected option
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const [searchText, setSearchText] = React.useState<string>(
    searchValue ?? selectedOption?.label ?? '',
  )

  // Calculate display value for input
  const displayValue = React.useMemo(() => {
    if (searchText === '') return ''
    return searchText || selectedOption?.label
  }, [searchText, selectedOption])

  // Sort and filter options, ensuring selected option is at the top
  const filteredOptions = React.useMemo(() => {
    let result: AutoCompleteOption<TData>[] = []

    if (onSearch) {
      // If external search is used, take all options
      result = [...options]
    } else if (searchText !== selectedOption?.label || !searchText) {
      // Filter by search text
      const searchLower = (searchText || '').toLowerCase()
      result = options.filter((option) =>
        option.label.toLowerCase().includes(searchLower),
      )
    } else {
      // No search text, use all options
      result = [...options]
    }

    // Always make sure selected option is at the top if it exists in filtered results
    if (selectedOption) {
      const selectedIndex = result.findIndex(
        (option) => option.value === selectedOption.value,
      )
      if (selectedIndex > -1) {
        // Remove from current position and add to top
        const [selected] = result.splice(selectedIndex, 1)
        result.unshift(selected)
      }
    }

    return result
  }, [onSearch, options, searchText, selectedOption])

  // Handle popover close
  const handlePopoverClose = React.useCallback(() => {
    const isOptionNotFound = !options.find((option) => {
      return option.label.toLowerCase().includes((searchText || '').toLowerCase())
    })

    // Clear selection if search is empty
    if (searchText === '' && selectedOption) {
      onSelect('')
    }

    // Reset to selected option's label if search doesn't match any option
    if (searchText && isOptionNotFound) {
      setSearchText(selectedOption?.label || '')
    }

    if (onSearch && !selectedOption && searchText === '') {
      onSearch('')
    }
  }, [options, searchText, selectedOption, onSelect, onSearch])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value)
      if (onSearch) onSearch(e.target.value)
    },
    [onSearch],
  )

  const handleInputFocus = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsOpen(true)
      if (onFocus) onFocus(e)
    },
    [onFocus],
  )

  const handleInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      handlePopoverClose()
      setIsOpen(false)
      if (onBlur) onBlur(e)
    },
    [handlePopoverClose, onBlur],
  )

  const handleSelectOption = React.useCallback(
    (option: AutoCompleteOption<TData>) => {
      setSearchText(option.label)
      onSelect(option.value, option)
      setIsOpen(false)
    },
    [onSelect],
  )

  // Reset search when selection is cleared
  React.useEffect(() => {
    if (value === undefined || value === '') {
      setSearchText('')
    }
  }, [value])

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          handlePopoverClose()
        }
      }}
    >
      <PopoverAnchor>
        <Input
          autoComplete="off"
          className={className}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          ref={inputRef}
          suffix={
            <Flex gap="2" className="px-2">
              <div
                className={cn(isOpen && 'rotate-180', 'transition')}
                onClick={() => !isOpen && inputRef.current?.focus()}
              >
                <Icon name="TriangleDownFilled" size={18} />
              </div>
              {closable && selectedOption && (
                <div
                  className="hover:cursor-pointer"
                  onClick={() => {
                    setSearchText('')
                    onSelect('')
                    if (onRemove) onRemove()
                  }}
                >
                  <Icon name="CloseOutlined" size={18} />
                </div>
              )}
            </Flex>
          }
        />
      </PopoverAnchor>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="px-0 py-0 border-border-secondary z-[9999]"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Flex
          direction="col"
          className="px-1.5 py-2 z-50 rounded max-h-[268px] overflow-auto"
          tabIndex={-1}
        >
          {isLoading && (
            <div className="flex justify-center py-2 text-brand-500">
              <Spinner />
            </div>
          )}
          {!isLoading && (!filteredOptions || filteredOptions.length === 0) && (
            <Text className="text-neutral-400 px-2">Tidak ada hasil yang ditemukan</Text>
          )}
          {filteredOptions.map((option) => {
            const isSelected = value?.toLowerCase() === option.value.toLowerCase()
            const optionContent = customRender ? (
              customRender(option)
            ) : (
              <Text className={cn(isSelected && 'font-semibold', 'font-medium')}>
                {searchText &&
                option.label.toLowerCase().includes(searchText.toLowerCase())
                  ? option.label
                      .split(
                        new RegExp(
                          `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                          'i',
                        ),
                      )
                      .map((part, i) =>
                        part.toLowerCase() === searchText.toLowerCase() ? (
                          <span key={i} className="text-brand-500">
                            {part}
                          </span>
                        ) : (
                          part
                        ),
                      )
                  : option.label}
              </Text>
            )

            return (
              <div
                key={option.value}
                className={cn(
                  'flex items-center justify-between gap-2 hover:cursor-pointer hover:bg-brand-50 p-2 rounded',
                  isSelected && 'bg-brand-50 hover:bg-brand-50',
                  isPlaceholderData && 'opacity-50',
                )}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectOption(option)
                }}
              >
                {optionContent}
                {isSelected && (
                  <div className="text-brand-400">
                    <Icon name="CheckOutlined" size={18} />
                  </div>
                )}
              </div>
            )
          })}
          {hasNextPage && onFetchNextPage && (
            <InfiniteScrollLoader
              onLoadMore={onFetchNextPage}
              isLoading={isFetchingNextPage}
            />
          )}
        </Flex>
        {optionSuffix && (
          <div className="px-1.5 border-t border-border-secondary">{optionSuffix}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function InfiniteScrollLoader({
  onLoadMore,
  isLoading,
}: {
  onLoadMore: () => void
  isLoading?: boolean
}) {
  const loaderRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = loaderRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 1.0, rootMargin: '50px' },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [isLoading, onLoadMore])

  return (
    <div ref={loaderRef} className="flex justify-center min-h-2 w-full text-brand-500">
      {isLoading && <Spinner size="lg" />}
    </div>
  )
}

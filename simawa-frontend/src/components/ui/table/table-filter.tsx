'use client'

import { useCallback } from 'react'
import { Pagination } from '@/lib/models/common'
import { cn } from '@/lib/utils'
import Icon from '@/components/icons'
import InputSearch from '../input-search'
import { Text } from '../typography/text'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Button } from '../button'
import { Flex } from '../layout/flex'

type FilterOption = { label: string; value: string; isActive: boolean }

type TableFilterProps = {
  pagination: Pagination
  params: { [key: string]: string }
  setParams: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
  filterOptions?: FilterOption[]
  onToggleChanged?: (option: { value: string; isActive: boolean }) => void
  dataLength?: number
  placeholderSearch?: string
}

function TableFilter({
  pagination,
  params,
  setParams,
  filterOptions = [],
  onToggleChanged,
  dataLength,
  placeholderSearch = 'Cari...',
}: TableFilterProps) {
  const currentPage = Number(params.page)
  const totalPages = pagination?.total_pages || 0

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setParams((params) => ({ ...params, page: String(currentPage + 1) }))
    }
  }, [currentPage, totalPages, setParams])

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setParams((params) => ({ ...params, page: String(currentPage - 1) }))
    }
  }, [currentPage, setParams])

  const handleSearch = useCallback(
    (value: string) => setParams((params) => ({ ...params, search: value })),
    [setParams],
  )

  const handleLimitChange = useCallback(
    (value: string) => setParams((params) => ({ ...params, limit: value })),
    [setParams],
  )

  const renderFilterButtons = () => {
    if (!filterOptions.length) return null

    return (
      <>
        <div className="hidden sm:flex items-center justify-center gap-1">
          <Text
            className="flex flex-row text-slate-700 items-center text-center mx-2 hover:cursor-default"
            level="m"
          >
            <Icon name="TunedOutline" size={20} className="mr-2 text-slate-500" />
            Filter
          </Text>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              className={cn(
                opt.isActive &&
                  'bg-main-50 text-main-500 hover:bg-main-50 hover:text-main-500',
              )}
              onClick={() =>
                onToggleChanged?.({ value: opt.value, isActive: !opt.isActive })
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="block sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="focus:outline-none">
              <button className="flex gap-1 items-center">
                <Text
                  className="flex flex-row text-slate-700 items-center text-center mx-2 hover:cursor-default"
                  level="m"
                >
                  <Icon name="TunedOutline" size={20} className="mr-2 text-slate-500" />
                  Filter
                </Text>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-30">
              <DropdownMenuRadioGroup
                value={filterOptions.find((opt) => opt.isActive)?.value}
                onValueChange={(value) => onToggleChanged?.({ value, isActive: true })}
              >
                {filterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    )
  }

  const renderPagination = () => {
    if (!pagination) return null
    const firstNo =
      pagination.page_size * pagination.current_page - pagination.page_size + 1
    const lastNo = dataLength ? firstNo + dataLength - 1 : 0

    return (
      <Flex gap="6" className="w-full justify-between">
        <Flex gap="1" alignItems="center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="focus:outline-none">
              <button className="flex gap-1 items-center">
                <Text>{pagination.page_size}</Text>
                <Icon name="TriangleDownFilled" size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-10">
              <DropdownMenuRadioGroup
                value={String(pagination.page_size)}
                onValueChange={handleLimitChange}
              >
                {[10, 25, 50].map((limit) => (
                  <DropdownMenuRadioItem key={limit} value={String(limit)}>
                    {limit}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Text className="max-[360px]:hidden">Baris per halaman</Text>
          <Text className="max-[360px]:block hidden">Baris</Text>
        </Flex>
        <Flex gap="1" alignItems="center">
          <Text>
            {firstNo}-{lastNo}
          </Text>
          <Text>dari</Text>
          <Text>{pagination.total_records}</Text>
        </Flex>
        <div className="flex">
          <Button
            variant="ghost"
            size="xs"
            disabled={currentPage < 2}
            onClick={handlePrevPage}
            className="text-lg"
          >
            <Icon name="ChevronLeftOutlined" size={20} />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
          >
            <Icon name="ChevronRightOutlined" size={20} />
          </Button>
        </div>
      </Flex>
    )
  }

  return (
    <Flex className="flex-col flex-wrap sm:flex-row gap-4 sm:gap-2 mb-4 sm:mb-4">
      <div className="flex flex-row gap-2 items-center">
        <InputSearch
          className=" sm:w-[200px]"
          placeholder={placeholderSearch}
          inputSize="sm"
          value={params.search}
          onSearch={handleSearch}
        />
        {renderFilterButtons()}
      </div>
      <div className="ml-auto w-full sm:w-auto">{renderPagination()}</div>
    </Flex>
  )
}

export { TableFilter }

'use client'
import { useState } from 'react'
import Icon from '@/components/icons'
import { Pagination } from '@/lib/models/common'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Flex } from '../layout/flex'
import { Text } from '../typography/text'
import { Button } from '../button'

export const TablePagination = ({
  data,
  className,
  onLimitChange,
  onNext,
  onPrev,
}: {
  data: Partial<Pagination & { pageLength?: number }>
  className?: string
  onLimitChange: (value: number) => void
  onNext: (currPage: number) => void
  onPrev: (currPage: number) => void
}) => {
  const [openRowDropdown, setOpenRowDropdown] = useState(false)

  const currentPageFirst =
    (data.page_size || 0) * (data.current_page || 0) - (data.page_size || 0) + 1
  const endRange = data.pageLength ? currentPageFirst + data.pageLength - 1 : 0
  const currentPageLast =
    endRange > (data?.total_records ?? 0) ? data?.total_records : endRange

  const hasPrev = (data.current_page || 0) > 1
  const hasNext = (data.current_page || 0) < (data.total_pages || 0)

  return (
    <Flex
      direction="row"
      justifyContent="end"
      gap="3"
      alignItems="center"
      className={className}
    >
      <DropdownMenu open={openRowDropdown} onOpenChange={setOpenRowDropdown}>
        <DropdownMenuTrigger>
          <Text className="flex gap-1 items-center">
            {String(data.page_size) || '10'}
            <Icon
              name={openRowDropdown ? 'ChevronUpOutlined' : 'ChevronDownOutlined'}
              size={18}
            />
          </Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={String(data.page_size)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <DropdownMenuRadioItem value="10">10</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="25">25</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="50">50</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Text>Rows per page</Text>
      <Text>
        {currentPageFirst}-{currentPageLast} of {data.total_records}
      </Text>
      <div>
        <Button
          variant={'icon'}
          disabled={!hasPrev}
          onClick={() => onPrev(data.current_page || 0)}
        >
          <Icon name="ChevronLeftOutlined" size={18} />
        </Button>
        <Button
          variant={'icon'}
          disabled={!hasNext}
          onClick={() => onNext(data.current_page || 0)}
        >
          <Icon name="ChevronRightOutlined" size={18} />
        </Button>
      </div>
    </Flex>
  )
}

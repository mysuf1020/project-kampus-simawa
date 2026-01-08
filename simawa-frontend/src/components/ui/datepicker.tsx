'use client'

import * as React from 'react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Icon from '../icons'

type DatePickerProps = {
  value: Date | undefined
  onChange: (value: Date | undefined) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className="data-[empty=true]:text-muted-foreground w-auto justify-start text-left font-normal"
        >
          <Icon name="CalendarOutlined" size={16} />
          {value ? format(value, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(value) => {
            onChange(value)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

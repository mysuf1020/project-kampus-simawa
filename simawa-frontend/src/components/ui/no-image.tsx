import Icon from '@/components/icons'

const NoImage = () => {
  return (
    <div className="w-[280px] h-[160px] flex items-center justify-center bg-neutral-30 rounded-md  text-muted-foreground">
      <Icon name="IconImageRoundedOutlined" size={64} />
    </div>
  )
}

export { NoImage }

'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '../icons'
import { Flex, Text } from '.'

function BackButton({
  href,
  label,
  className,
  handleBack,
}: {
  href?: string
  label: string
  className?: string
  handleBack?: () => void
}) {
  const router = useRouter()
  if (!href) {
    return (
      <div className={className}>
        <div
          onClick={handleBack ? handleBack : () => router.back()}
          className="inline-block text-neutral-700 hover:text-neutral-900 hover:cursor-pointer"
        >
          <Flex gap="2" alignItems="center">
            <Icon name="ArrowLeftOutlined" size={18} />
            <Text level="m">{label}</Text>
          </Flex>
        </div>
      </div>
    )
  }
  return (
    <div className={className}>
      <Link href={href} className="inline-block text-neutral-700 hover:text-neutral-900">
        <Flex gap="2" alignItems="center">
          <Icon name="ArrowLeftOutlined" size={18} />
          <Text level="m">{label}</Text>
        </Flex>
      </Link>
    </div>
  )
}

export { BackButton }

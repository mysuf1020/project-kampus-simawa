import { Flex } from '../layout/flex'
import { Text } from '../typography/text'
import { Title } from '../typography/title'

type EmptyTableProps = {
  title: string
  description: string
  icon: React.ReactElement
  action?: React.ReactElement
}

const EmptyTable = ({ title, description, action, icon }: EmptyTableProps) => {
  return (
    <Flex
      direction="col"
      gap="2"
      alignItems="center"
      className="w-full sm:w-[400px] mx-auto my-10"
    >
      {icon}
      <Title level="h2">{title}</Title>
      <Text className="text-center">{description}</Text>
      {action && action}
    </Flex>
  )
}

export { EmptyTable }

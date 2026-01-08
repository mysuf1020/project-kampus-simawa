import Icon from '@/components/icons'
import { Container } from '../layout/container'
import { Flex } from '../layout/flex'

export const Forbidden = () => {
  return (
    <Container className="h-screen">
      <Flex
        direction="col"
        alignItems="center"
        justifyContent="center"
        className="h-full"
        gap="1"
      >
        <div>
          <Icon name="PlusCloseCircleOutlined" size={82} className="text-red-450" />
        </div>
        <div className="italic">
          <strong>Whoops!</strong>
        </div>
        <div>
          It looks like you don&apos;t have the required permission for this page. Please
          contact administrator to register your permission.
        </div>
      </Flex>
    </Container>
  )
}

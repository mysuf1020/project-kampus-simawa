/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from '@/components/icons'
import { Button, Card, Flex, Skeleton, Text, Title } from '@/components/ui'

function QueryRenderer<TData extends object>({
  data,
  loading,
  error,
  loadingRender,
  errorRender,
  render,
}: {
  data: TData | null | undefined
  loading: boolean
  error: unknown
  render: (data: TData) => React.ReactElement
  loadingRender?: React.ReactElement
  errorRender?: React.ReactElement | ((error: unknown) => React.ReactElement)
}) {
  if (loading) {
    if (loadingRender) return loadingRender
    return <Skeleton style={{ width: '100%', height: 200 }} />
  }

  if (error) {
    if (errorRender) {
      if (typeof errorRender === 'function') {
        return errorRender(error)
      } else {
        return errorRender
      }
    }
    const errorCode =
      (error as any)?.code ?? (error as any)?.response?.error?.code ?? '500'
    const errorMessage =
      (error as any)?.message ??
      (error as any)?.response?.error?.message ??
      'Coba beberapa saat lagi'

    return (
      <Card className="px-7 py-5 bg-neutral-50 border-0">
        <Flex gap="2" justifyContent="start">
          <div>
            <Icon name="PlusCloseCircleOutlined" className="text-red-500" size={48} />
          </div>
          <Flex direction="col" gap="1">
            <Title level="h3">Terjadi kesalahan saat memuat data</Title>
            <Text className="text-secondary mb-2">
              {errorCode} - {errorMessage}
            </Text>
            <Flex gap="2">
              <Button>
                <Icon name="RefreshRoundedOutlined" size={18} />
                Refresh
              </Button>
              <Button variant={'outline'}>
                <Icon name="HelpCircleOutlined" />
                Bantuan
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    )
  }

  if (data !== undefined && typeof data !== 'boolean' && data) return render(data)
  return null
}

export { QueryRenderer }

import { Container } from '../layout/container'
import { Separator } from '../separator'
import { Skeleton, SkeletonCircle } from '.'

const SkeletonPage = () => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div>
        <Container className="py-14 ">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex flex-col gap-8">
                <div className="w-[60%] sm:w-[30%]">
                  <Skeleton style={{ height: 36 }} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-[80%] sm:w-[40%]">
                    <Skeleton style={{ height: 24 }} />
                  </div>
                  <div className="w-[80%] sm:w-[40%]">
                    <Skeleton style={{ height: 24 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[140px]">
              <Skeleton className="w-full h-8" />
            </div>
          </div>
        </Container>
      </div>

      <Separator borderColor="tertiary" />

      <Container>
        <div className="flex flex-col gap-6 py-14">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="w-[240px]">
                <Skeleton className="w-full h-8" />
              </div>
              <div className="w-[40px]">
                <Skeleton className="w-full h-8" />
              </div>
            </div>
            <div className="flex items-end sm:items-center gap-4">
              <div className="hidden sm:block">
                <SkeletonCircle style={{ width: 24, height: 24 }} />
              </div>
              <div className="w-[80px]">
                <Skeleton className="w-full h-5" />
              </div>
              <div className="w-[140px] hidden sm:block">
                <Skeleton className="w-full h-5" />
              </div>
              <div className="hidden sm:block">
                <SkeletonCircle style={{ width: 24, height: 24 }} />
              </div>
            </div>
          </div>
          <div className="flex-col gap-4 mt-8">
            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>

            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>

            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>

            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>

            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>

            <div className="flex justify-between gap-8">
              <div className="w-[180px] flex-0">
                <Skeleton className="w-full h-5" />
              </div>
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
              <Skeleton className="w-full h-5 hidden sm:block" />
            </div>
            <div className="py-6 opacity-50">
              <Separator borderColor="tertiary" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export { SkeletonPage }

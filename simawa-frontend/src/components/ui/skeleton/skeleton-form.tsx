import { Skeleton } from '.'

const SkeletonForm = () => {
  return (
    <div className="relative bg-white w-full h-full">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="w-[20%]">
            <Skeleton />
          </div>
          <div className="w-[60%]">
            <Skeleton style={{ height: 36 }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="w-[20%]">
            <Skeleton />
          </div>
          <div className="w-[60%]">
            <Skeleton style={{ height: 36 }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="w-[20%]">
            <Skeleton />
          </div>
          <div className="w-[60%]">
            <div className="flex gap-4">
              <Skeleton style={{ height: 36 }} />
              <Skeleton style={{ height: 36 }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="w-[20%]">
            <Skeleton />
          </div>
          <div className="w-[60%]">
            <Skeleton style={{ height: 80 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export { SkeletonForm }

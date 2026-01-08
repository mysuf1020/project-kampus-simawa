import { Skeleton } from '.'

export const SkeletonTable = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between gap-6">
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
        <div className="w-1/6">
          <Skeleton className="w-full !h-[28px]" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
        <Skeleton className="w-full !h-[40px]" />
      </div>
    </div>
  )
}

import { Skeleton } from "./ui/skeleton";

export default function FiltersSkeleton() {
  return (
    <div className="bg-white">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-20 hidden lg:block" />
        <Skeleton className="h-8 w-20 lg:hidden" />
      </div>

      {/* Filter sections skeleton */}
      <div className="space-y-6">
        {[...Array(4)].map((_, sectionIdx) => (
          <div key={sectionIdx} className="border-b border-gray-200 pb-6">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, optionIdx) => (
                <div key={optionIdx} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
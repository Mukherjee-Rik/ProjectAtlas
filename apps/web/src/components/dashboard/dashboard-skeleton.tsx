export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#18212B]" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-[#18212B]" />
        </div>

        <div className="flex gap-3">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-[#18212B]" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-[#18212B]" />
        </div>
      </div>

      {/* Stat Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-[#18212B]"
          />
        ))}
      </div>

      {/* Main Grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-[#18212B] lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl bg-[#18212B] lg:col-span-1" />
      </div>
    </div>
  );
}

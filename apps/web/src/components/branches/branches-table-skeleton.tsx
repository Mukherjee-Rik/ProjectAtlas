export function BranchesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl animate-pulse">
      <div className="border-b border-[#26313C] bg-[#18212B] p-4">
        <div className="h-4 w-48 rounded bg-[#26313C]" />
      </div>

      <div className="divide-y divide-[#26313C]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-[#26313C]" />
              <div className="h-3 w-20 rounded bg-[#26313C]" />
            </div>
            <div className="h-6 w-16 rounded bg-[#26313C]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BranchesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card animate-pulse">
      <div className="border-b border-border bg-secondary p-4">
        <div className="h-4 w-48 rounded bg-border" />
      </div>

      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-border" />
              <div className="h-3 w-20 rounded bg-border" />
            </div>
            <div className="h-6 w-16 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

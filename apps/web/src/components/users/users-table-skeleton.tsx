export function UsersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-12 w-full animate-pulse rounded-lg bg-secondary"
          />
        ))}
      </div>
    </div>
  );
}

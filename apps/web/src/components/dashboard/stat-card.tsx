interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
}

export function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-md">
      <p className="text-sm font-medium text-muted-foreground">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

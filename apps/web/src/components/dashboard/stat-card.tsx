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
    <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-md">
      <p className="text-sm font-medium text-[#9AA6B2]">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold text-[#F5F7FA]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-[#9AA6B2]">
          {description}
        </p>
      )}
    </div>
  );
}

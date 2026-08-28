import type { UserRole } from '@/types/user';

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({
  role,
}: UserRoleBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
      {role}
    </span>
  );
}

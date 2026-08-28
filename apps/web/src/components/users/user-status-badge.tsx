import type { UserStatus } from '@/types/user';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({
  status,
}: UserStatusBadgeProps) {
  const classes: Record<UserStatus, string> = {
    ACTIVE: 'bg-primary/15 text-primary border border-primary/30',
    INACTIVE: 'bg-border/50 text-muted-foreground border border-border',
    SUSPENDED: 'bg-atlas-error/15 text-atlas-error border border-atlas-error/30',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {status}
    </span>
  );
}

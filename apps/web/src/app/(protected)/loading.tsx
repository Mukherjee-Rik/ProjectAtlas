import { SkeletonTable } from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/primitives';

/**
 * Shown while a protected route segment streams in, so navigation gives
 * immediate feedback instead of appearing to hang on a blank frame.
 */
export default function ProtectedLoading() {
  return (
    <div className="space-y-6 sm:space-y-8" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}

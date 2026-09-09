import { Skeleton, SkeletonText } from './primitives';

/**
 * Blocking loading state for a detail screen (profile, a single user).
 *
 * It paints the shape that is about to arrive — title, subtitle, one panel —
 * so the page does not appear all at once after a blank box. The label is for
 * assistive tech; the bars themselves are decorative and hidden from it.
 */
export function PageLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <SkeletonText lines={4} />
      </div>
    </div>
  );
}

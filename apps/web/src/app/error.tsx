'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Root error boundary. Without one, an uncaught render error left the user
 * looking at a blank page with no way forward.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in server logs / the browser console for diagnosis. `digest`
    // is the identifier that correlates with the server-side stack trace.
    console.error('[atlas] unhandled application error', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-atlas-error/30 bg-atlas-error/10 text-atlas-error">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>

      <p className="max-w-md text-sm text-muted-foreground">
        This screen failed to load. Your data has not been changed — try again,
        and if it keeps happening quote the reference below to support.
      </p>

      {error.digest && (
        <code className="rounded border border-border bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
          {error.digest}
        </code>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
        >
          Try again
        </button>

        <a
          href="/dashboard"
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}

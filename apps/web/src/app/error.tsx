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
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="text-xl font-bold text-[#F5F7FA]">Something went wrong</h1>

      <p className="max-w-md text-sm text-[#9AA6B2]">
        This screen failed to load. Your data has not been changed — try again,
        and if it keeps happening quote the reference below to support.
      </p>

      {error.digest && (
        <code className="rounded border border-[#26313C] bg-[#18212B] px-2 py-1 font-mono text-xs text-[#9AA6B2]">
          {error.digest}
        </code>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-bold text-[#0B0F14] transition-colors hover:bg-[#22E5A4]"
        >
          Try again
        </button>

        <a
          href="/dashboard"
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}

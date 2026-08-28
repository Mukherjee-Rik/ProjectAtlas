interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  message = 'Something went wrong.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-6 text-center">
      <p className="text-sm font-medium text-atlas-error">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-all hover:border-primary hover:text-primary"
        >
          Try again
        </button>
      )}
    </div>
  );
}

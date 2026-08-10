interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  message = 'Something went wrong.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-6 text-center">
      <p className="text-sm font-medium text-[#EF4444]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA] transition-all hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

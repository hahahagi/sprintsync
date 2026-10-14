interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center text-red-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
        <span className="material-symbols-outlined !text-[28px]">error</span>
      </div>
      <div>
        <p className="font-bold text-base text-red-950">Analysis Failed</p>
        <p className="mt-1 text-xs text-red-700 max-w-md">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-red-700 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined !text-[18px]">refresh</span>
        <span>Try Again</span>
      </button>
    </div>
  );
}
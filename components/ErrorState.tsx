import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <div>
        <p className="font-medium text-red-700">Analysis Failed</p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

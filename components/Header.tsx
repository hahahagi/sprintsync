import { Zap } from "lucide-react";

interface HeaderProps {
  demoMode: boolean;
}

export function Header({ demoMode }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              SprintSync
            </span>
            <span className="ml-2 text-xs text-slate-500 hidden sm:inline">
              Meeting to Sprint Converter
            </span>
          </div>
        </div>
        {demoMode && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <span className="material-symbols-outlined !text-[16px]">toggle_on</span>
            <span>Demo Mode Active</span>
          </span>
        )}
      </div>
    </header>
  );
}
import { Zap } from "lucide-react";

interface HeaderProps {
  demoMode: boolean;
}

export function Header({ demoMode }: HeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">SprintSync</span>
          <span className="text-sm text-slate-400 hidden sm:inline">
            AI Meeting → Sprint Converter
          </span>
        </div>
        {demoMode && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Demo Mode
          </span>
        )}
      </div>
    </header>
  );
}

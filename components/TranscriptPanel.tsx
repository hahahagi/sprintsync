interface TranscriptPanelProps {
  transcript: string;
  onChange: (value: string) => void;
  disabled: boolean;
  maxLength?: number;
}

export function TranscriptPanel({
  transcript,
  onChange,
  disabled,
  maxLength = 6000,
}: TranscriptPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Meeting Transcript
        </label>
        <span className="text-xs text-slate-400">
          {transcript.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={transcript}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        placeholder="Paste your meeting transcript here, or select a sample above…"
        className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
      />
    </div>
  );
}

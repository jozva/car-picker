export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 capitalize text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${Math.min(value * 5, 100)}%` }}
        />
      </div>
    </div>
  );
}

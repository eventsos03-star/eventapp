export function StatCard({
  label,
  value,
  hint,
  accent = 'slate',
}: {
  label: string
  value: number | string
  hint?: string
  accent?: 'amber' | 'slate'
}) {
  const accentText = accent === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-extrabold tracking-tight ${accentText}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

'use client'

export type Tab = 'pending' | 'approved' | 'rejected' | 'deleted'
export type UserTab = 'all' | 'deleted'
export type EventTab = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
export type Message = { type: 'success' | 'error'; text: string } | null

export const STATUS_TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deleted', label: 'Deleted' },
]

export const EVENT_TABS: { value: EventTab; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

export const STATUS_STYLES: Record<Tab | 'blocked', string> = {
  pending: 'bg-amber/20 text-amber-deep',
  approved: 'bg-teal/15 text-teal',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
  deleted: 'bg-paper-dim text-ink/60',
}

export const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-amber/20 text-amber-deep',
  advancePaid: 'bg-teal/15 text-teal',
  fullyPaid: 'bg-teal/15 text-teal',
}

export const EVENT_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-paper-dim text-ink/70',
  published: 'bg-teal/15 text-teal',
  ongoing: 'bg-teal/15 text-teal',
  completed: 'bg-amber/20 text-amber-deep',
  cancelled: 'bg-red-100 text-red-700',
}

export function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
      <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
      <p className="text-xs font-semibold tracking-wide text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value ?? '—'}</p>
    </div>
  )
}

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            active === tab.value
              ? 'bg-amber text-ink'
              : 'text-paper-dim/60 hover:text-paper-dim'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function UserTabBar({ active, onChange }: { active: UserTab; onChange: (t: UserTab) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
      {(['all', 'deleted'] as UserTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
            active === tab
              ? 'bg-amber text-ink'
              : 'text-paper-dim/60 hover:text-paper-dim'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function EventTabBar({ active, onChange }: { active: EventTab; onChange: (t: EventTab) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-paper-dim bg-ink-soft p-1">
      {EVENT_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            active === tab.value
              ? 'bg-amber text-ink'
              : 'text-paper-dim/60 hover:text-paper-dim'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
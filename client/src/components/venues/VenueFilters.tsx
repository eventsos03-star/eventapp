'use client'

import { useState } from 'react'

export interface VenueFiltersState {
  minCapacity: number | null
  maxPrice: number | null
}

interface VenueFiltersProps {
  value: VenueFiltersState
  onChange: (filters: VenueFiltersState) => void
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

export default function VenueFilters({ value, onChange }: VenueFiltersProps) {
  const [minCapacity, setMinCapacity] = useState(value.minCapacity ? String(value.minCapacity) : '')
  const [maxPrice, setMaxPrice] = useState(value.maxPrice ? String(value.maxPrice) : '')

  function apply() {
    onChange({
      minCapacity: minCapacity ? Number(minCapacity) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
    })
  }

  function reset() {
    setMinCapacity('')
    setMaxPrice('')
    onChange({ minCapacity: null, maxPrice: null })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Minimum Capacity</label>
        <input
          type="number"
          min={1}
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          placeholder="e.g. 500"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Max Price / Day (INR)</label>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="e.g. 100000"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

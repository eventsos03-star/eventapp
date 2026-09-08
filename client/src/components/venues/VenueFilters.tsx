'use client'

import { useState, useEffect } from 'react'

export interface VenueFiltersState {
  minCapacity: number | null
  maxPrice: number | null
}

interface VenueFiltersProps {
  value: VenueFiltersState
  onChange: (filters: VenueFiltersState) => void
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

export default function VenueFilters({ value, onChange }: VenueFiltersProps) {
  const [minCapacity, setMinCapacity] = useState(
    value.minCapacity !== null ? String(value.minCapacity) : '',
  )
  const [maxPrice, setMaxPrice] = useState(
    value.maxPrice !== null ? String(value.maxPrice) : '',
  )

  useEffect(() => {
    setMinCapacity(value.minCapacity !== null ? String(value.minCapacity) : '')
    setMaxPrice(value.maxPrice !== null ? String(value.maxPrice) : '')
  }, [value.minCapacity, value.maxPrice])

  const hasChanges =
    (minCapacity !== '' && Number(minCapacity) !== value.minCapacity) ||
    (maxPrice !== '' && Number(maxPrice) !== value.maxPrice) ||
    (minCapacity === '' && value.minCapacity !== null) ||
    (maxPrice === '' && value.maxPrice !== null)

  function apply() {
    onChange({
      minCapacity: minCapacity !== '' ? Number(minCapacity) : null,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
    })
  }

  function reset() {
    setMinCapacity('')
    setMaxPrice('')
    onChange({ minCapacity: null, maxPrice: null })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-36">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Min capacity
        </label>
        <input
          type="number"
          min={1}
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Any"
          className={inputClass}
        />
      </div>

      <div className="w-40">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Max price / day
        </label>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Any"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={!hasChanges}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

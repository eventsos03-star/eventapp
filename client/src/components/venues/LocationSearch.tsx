'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import type { GeocodingResult } from '../../types'

interface LocationSearchProps {
  value: { lat: number; lng: number; label: string } | null
  onChange: (
    location: { lat: number; lng: number; label: string } | null,
  ) => void
}

export default function LocationSearch({
  value,
  onChange,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value?.label ?? '')
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Clearing the field resets the location filter -> show all venues again
    if (!val.trim()) {
      setResults([])
      setSearching(false)
      setOpen(false)
      if (value !== null) onChange(null)
      return
    }

    setOpen(true)
    if (val.trim().length < 3) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(() => {
      api
        .searchLocations(val)
        .then(({ data }) => {
          setResults(data ?? [])
          setOpen(true)
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 500)
  }

  function select(result: GeocodingResult) {
    const label =
      result.formattedAddress ||
      [result.city, result.state, result.country].filter(Boolean).join(', ') ||
      'Selected location'
    onChange({ lat: result.latitude, lng: result.longitude, label })
    setQuery(label)
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 17a6 6 0 100-12 6 6 0 000 12z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() =>
            (results.length > 0 || (query.trim().length >= 3 && searching)) &&
            setOpen(true)
          }
          placeholder="Search a city or area…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}
        {query && !searching && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear location"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {results.map((r, i) => {
            const label =
              r.address ||
              r.formattedAddress ||
              [r.city, r.state, r.country].filter(Boolean).join(', ') ||
              r.city
            return (
              <button
                key={`${r.latitude}-${r.longitude}-${i}`}
                type="button"
                onClick={() => select(r)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition hover:bg-amber-50"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    {label}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {[r.city, r.state, r.country].filter(Boolean).join(', ')}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {open &&
        !searching &&
        query.trim().length >= 3 &&
        results.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-lg">
            <p className="text-sm text-slate-500">
              No locations found. Try a different search.
            </p>
          </div>
        )}
    </div>
  )
}

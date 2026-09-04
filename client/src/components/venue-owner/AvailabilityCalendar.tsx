'use client'

import { addMonths, format, isSameMonth, isSameYear } from 'date-fns'
import { useState } from 'react'
import type { VenueBooking } from '../../types'
import { buildCalendar } from '../../lib/calendar'
import type { DayCell } from '../../lib/calendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_STYLES: Record<string, { dot: string; bg: string; muted: boolean }> = {
  booked: { dot: 'bg-red-500', bg: 'bg-red-100 text-red-800', muted: false },
  pending: { dot: 'bg-amber-500', bg: 'bg-amber-100 text-amber-900', muted: false },
  past: { dot: 'bg-slate-300', bg: 'bg-slate-100 text-slate-400', muted: true },
  available: { dot: 'bg-emerald-500', bg: 'bg-emerald-100 text-emerald-900', muted: false },
}

export function AvailabilityCalendar({
  bookings,
  venueName,
  onSelectDay,
}: {
  bookings: VenueBooking[]
  venueName: string
  onSelectDay: (cell: DayCell) => void
}) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date())

  const cells = buildCalendar(cursor.getFullYear(), cursor.getMonth(), bookings, today)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Availability</h2>
          <p className="text-sm text-slate-500">{venueName || 'Select a venue'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ‹
          </button>
          <span className="min-w-[9rem] text-center text-sm font-bold text-slate-900">
            {format(cursor, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ›
          </button>
          {!(isSameMonth(cursor, today) && isSameYear(cursor, today)) && (
            <button
              type="button"
              onClick={() => setCursor(today)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-2 text-center text-xs font-semibold uppercase text-slate-400">
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          const style = STATUS_STYLES[cell.status]
          const isToday = format(cell.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(cell)}
              disabled={!cell.inMonth}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                cell.inMonth ? style.bg : 'opacity-40'
              } ${cell.status !== 'past' && cell.inMonth ? 'hover:ring-1 hover:ring-amber-400' : ''}`}
              title={
                cell.booking
                  ? `${priceable(cell)}`
                  : cell.status === 'available'
                    ? 'Available'
                    : cell.status
              }
            >
              <span
                className={`font-semibold ${style.muted ? 'text-slate-400' : ''} ${
                  cell.status === 'available' ? 'text-slate-800' : ''
                } ${isToday ? 'underline decoration-amber-500 decoration-2 underline-offset-2' : ''}`}
              >
                {format(cell.date, 'd')}
              </span>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
        <LegendItem dot="bg-emerald-500" label="Available" />
        <LegendItem dot="bg-amber-500" label="Pending request" />
        <LegendItem dot="bg-red-500" label="Booked / approved" />
        <LegendItem dot="bg-slate-300" label="Past" />
      </div>
    </div>
  )
}

function priceable(cell: DayCell): string {
  if (!cell.booking) return cell.status
  const start = format(new Date(cell.booking.startDate), 'MMM d')
  const end = format(new Date(cell.booking.endDate), 'MMM d')
  return `${cell.booking.status} · ${start}–${end}`
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
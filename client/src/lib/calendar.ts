import { format, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns'
import type { VenueBooking } from '../types'

export type CellStatus = 'past' | 'available' | 'pending' | 'booked'

export interface DayCell {
  key: string
  date: Date
  inMonth: boolean
  status: CellStatus
  booking: VenueBooking | null
}

// A booking blocks a day when it is approved (whole-day inclusive range).
// Pending renders as a request; rejected/cancelled/completed never block.
function bookingStatusForDay(booking: VenueBooking): CellStatus | null {
  if (booking.status === 'approved') return 'booked'
  if (booking.status === 'pending') return 'pending'
  return null
}

export function buildCalendar(
  year: number,
  month: number, // 0-indexed
  bookings: VenueBooking[],
  today: Date,
): DayCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: DayCell[] = []

  for (let i = 0; i < firstWeekday; i++) {
    const date = new Date(year, month, i - firstWeekday + 1)
    cells.push(makeCell(date, false, bookings, today))
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    cells.push(makeCell(date, true, bookings, today))
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    cells.push(makeCell(date, false, bookings, today))
  }

  return cells
}

function coversDay(dayStart: Date, booking: VenueBooking): boolean {
  const start = startOfDay(parseISO(booking.startDate))
  const end = startOfDay(parseISO(booking.endDate))
  return (dayStart >= start && dayStart <= end) || isSameDay(dayStart, start) || isSameDay(dayStart, end)
}

function makeCell(date: Date, inMonth: boolean, bookings: VenueBooking[], today: Date): DayCell {
  const todayStart = startOfDay(today)
  const dayStart = startOfDay(date)
  const isPast = isAfter(todayStart, dayStart)
  const key = format(dayStart, 'yyyy-MM-dd')

  let covering: VenueBooking | null = null
  let status: CellStatus = 'available'

  for (const booking of bookings) {
    if (!coversDay(dayStart, booking)) continue
    const s = bookingStatusForDay(booking)
    if (!s) continue
    // Priorize approved over pending.
    if (!covering || s === 'booked') {
      covering = booking
      status = s
    }
  }

  // Past days render as past regardless of a future-dated booking covering them.
  if (isPast) status = 'past'

  return { key, date, inMonth, status, booking: covering }
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
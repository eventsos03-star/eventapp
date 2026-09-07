'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { Layout } from '@/components/Layout'

const UPCOMING = [
  { code: 'SF-014', name: 'Founders Summit', date: 'AUG 22', seats: '412 going' },
  { code: 'NY-208', name: 'Indie Music Fest', date: 'AUG 29', seats: '1,204 going' },
  { code: 'LDN-057', name: 'Product Meetup', date: 'SEP 03', seats: '86 going' },
  { code: 'AU-133', name: 'Design Off-Site', date: 'SEP 11', seats: '150 going' },
]

const STEPS = [
  {
    n: '01',
    title: 'Build the event',
    body: 'Set the date, venue, and ticket tiers. Publish a page in minutes, no template wrestling.',
  },
  {
    n: '02',
    title: 'Open the door',
    body: 'Share a link, sell tickets, or let people RSVP. Every signup lands in one guest list.',
  },
  {
    n: '03',
    title: 'Run the day',
    body: 'Scan guests in at the entrance, message the room, and watch attendance move in real time.',
  },
]

const FEATURES = [
  {
    tag: 'TICKETING',
    title: 'Sell tickets, not spreadsheets',
    body: 'Tiered pricing, promo codes, and payouts that land in your account — set up once, runs itself.',
  },
  {
    tag: 'GUEST LIST',
    title: 'One list, always current',
    body: 'RSVPs, transfers, and plus-ones sync automatically. No more chasing three versions of a sheet.',
  },
  {
    tag: 'CHECK-IN',
    title: 'Scan and go',
    body: 'A phone camera is your door staff. Every scan updates attendance for the whole team, live.',
  },
  {
    tag: 'INSIGHT',
    title: 'See the room fill up',
    body: "Track registrations, traffic sources, and no-show risk while there's still time to act.",
  },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <Layout>
    <div className="min-h-screen bg-ink text-paper-dim font-sans">
      
          

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-10 lg:px-16">
        {/* hero */}
        <section className="max-w-2xl pt-14 sm:pt-20 lg:pt-28">
          <p className="mb-4 font-mono text-xs tracking-[0.16em] text-amber">
            EVENT MANAGEMENT, END TO END
          </p>
          <h1 className="font-display text-[40px] font-semibold leading-[1.04] tracking-tight text-paper-dim sm:text-5xl lg:text-[68px]">
            Plan the event.
            <br />
            We&apos;ll run the door.
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-paper-dim/60">
            Build the page, sell the tickets, track every RSVP, and check guests in at the
            entrance — all from one dashboard built for people who run events, not IT
            departments.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href={user ? '/events' : '/register'}
              className="rounded-lg bg-amber px-6.5 py-3.5 text-[15.5px] font-semibold text-ink transition hover:bg-amber-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
            >
              {user ? 'Events' : 'Create your first event'}
            </Link>
            <Link
              href="/login"
              className="text-[15.5px] font-semibold text-paper-dim/50 transition hover:text-amber"
            >
              I already have an account →
            </Link>
          </div>
        </section>

        {/* ticket-tear divider */}
        <div
          className="relative my-16 h-px"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, #333a4d 0, #333a4d 10px, transparent 10px, transparent 20px)',
          }}
          aria-hidden="true"
        >
          <span className="absolute -left-3 top-1/2 h-5.5 w-5.5 -translate-y-1/2 rounded-full bg-[#0e1016]" />
          <span className="absolute -right-3 top-1/2 h-5.5 w-5.5 -translate-y-1/2 rounded-full bg-[#0e1016]" />
        </div>

        {/* departures board */}
        <section
          aria-label="Upcoming events on EventOS"
          className="mb-20 rounded-xl border border-ink-line bg-ink-soft px-5 pb-2 pt-6 sm:px-8"
        >
          <span className="font-mono text-[11.5px] tracking-[0.14em] text-teal">
            NOW BOARDING
          </span>
          <div className="mt-3.5">
            {UPCOMING.map((e, i) => (
              <div
                key={e.code}
                className={`grid grid-cols-[56px_1fr] gap-3 py-3 font-mono text-sm sm:grid-cols-[72px_1fr_64px_100px] ${
                  i !== 0 ? 'border-t border-ink-line' : ''
                }`}
              >
                <span className="text-amber">{e.code}</span>
                <span className="font-sans text-[15px] font-medium text-paper-dim">
                  {e.name}
                </span>
                <span className="col-start-2 text-paper-dim/50 sm:col-start-3">{e.date}</span>
                <span className="col-start-2 text-left text-paper-dim/50 sm:col-start-4 sm:text-right">
                  {e.seats}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* steps — real sequence: build -> open -> run */}
        <section
          aria-label="How EventOS works"
          className="mb-22 grid grid-cols-1 gap-7 sm:grid-cols-3"
        >
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-[13px] text-amber">{s.n}</span>
              <h3 className="mt-2.5 mb-2 font-display text-xl font-semibold text-paper-dim">
                {s.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-paper-dim/55">{s.body}</p>
            </div>
          ))}
        </section>

        {/* feature grid — ticket-stub cards */}
        <section className="mb-22 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.tag}
              className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6"
            >
              <span
                className="absolute -top-2.5 right-7 h-5 w-5 rounded-full bg-ink"
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] tracking-[0.12em] text-amber-deep">
                {f.tag}
              </span>
              <h3 className="mt-2.5 mb-2 font-display text-xl font-semibold text-ink">
                {f.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-ink/55">{f.body}</p>
            </div>
          ))}
        </section>

        {/* closing */}
        <section className="flex flex-col items-center gap-5 border-t border-ink-line pt-14 text-center">
          <h2 className="max-w-lg font-display text-[28px] font-semibold text-paper-dim sm:text-4xl">
            Your next event starts with one page.
          </h2>
          <Link
            href={user ? '/dashboard' : '/register'}
            className="rounded-lg bg-amber px-6.5 py-3.5 text-[15.5px] font-semibold text-ink transition hover:bg-amber-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          >
            {user ? 'Open dashboard' : 'Create free account'}
          </Link>
        </section>
      </main>
    </div>
    </Layout>
  )
}
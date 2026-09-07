import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-ink-line px-5 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-ink">
            E
          </span>

          <span className="font-display text-lg font-semibold tracking-tight text-paper-dim">
            EventOS
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-5 text-sm text-paper-dim/55">
          <Link
            href="/events"
            className="transition hover:text-amber"
          >
            Events
          </Link>

          <Link
            href="/"
            className="transition hover:text-amber"
          >
            Home
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-sm text-paper-dim/40">
          © {new Date().getFullYear()} EventOS
        </p>
      </div>
    </footer>
  )
}
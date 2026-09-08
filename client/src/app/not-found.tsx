import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-5 text-slate-900 font-sans antialiased">
      {/* Ambient glow, consistent with the auth pages */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-slate-950 text-amber-400 font-black text-base sm:text-lg shadow-md">
            E
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
            Event<span className="text-amber-500">OS</span>
          </span>
        </div>

        <span className="text-7xl sm:text-8xl font-extrabold tracking-tight text-slate-200">
          404
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          That page doesn&apos;t exist, or it may have been moved.
        </p>

        <Link
          href="/"
          className="mt-8 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99]"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

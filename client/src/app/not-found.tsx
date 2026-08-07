import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="auth-card not-found">
        <h1 className="auth-title">404</h1>
        <p className="auth-subtitle">That page doesn't exist.</p>
        <Link href="/" className="btn btn-primary">Back to home</Link>
      </div>
    </main>
  )
}

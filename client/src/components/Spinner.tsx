export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current/30 border-t-current"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  )
}

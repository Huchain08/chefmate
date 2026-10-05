export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span aria-hidden="true" className="chefmate-loader" />
      <p className="text-sm text-muted-foreground">Loading</p>
    </div>
  )
}

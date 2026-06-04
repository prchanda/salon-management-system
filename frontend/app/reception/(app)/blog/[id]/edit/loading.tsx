export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-ink-900/10" />
      <div className="mt-2 h-3 w-64 rounded bg-ink-900/10" />

      <div className="mt-8 space-y-6 rounded-2xl bg-cream-50 p-6 shadow-soft">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-ink-900/10" />
          <div className="h-10 w-full rounded bg-ink-900/10" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-ink-900/10" />
            <div className="h-10 w-full rounded bg-ink-900/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-ink-900/10" />
            <div className="h-10 w-full rounded bg-ink-900/10" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-ink-900/10" />
          <div className="h-20 w-full rounded bg-ink-900/10" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-ink-900/10" />
          <div className="h-72 w-full rounded bg-ink-900/10" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-900/10 pt-6">
          <div className="h-4 w-32 rounded bg-ink-900/10" />
          <div className="flex gap-3">
            <div className="h-10 w-24 rounded bg-ink-900/10" />
            <div className="h-10 w-28 rounded bg-ink-900/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

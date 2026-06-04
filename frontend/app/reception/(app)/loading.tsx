export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-16 rounded bg-ink-900/10" />
          <div className="h-8 w-64 rounded bg-ink-900/10" />
          <div className="h-3 w-40 rounded bg-ink-900/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded bg-ink-900/10" />
          <div className="h-9 w-32 rounded bg-ink-900/10" />
          <div className="h-9 w-9 rounded bg-ink-900/10" />
          <div className="h-9 w-20 rounded bg-ink-900/10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream-50 p-4 shadow-soft sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2 w-16 rounded bg-ink-900/10" />
            <div className="h-7 w-12 rounded bg-ink-900/10" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, c) => (
          <div key={c} className="rounded-2xl bg-cream-50 p-6 shadow-soft">
            <div className="h-5 w-32 rounded bg-ink-900/10" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-14 rounded bg-ink-900/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-ink-900/10" />
                    <div className="h-3 w-56 rounded bg-ink-900/10" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-ink-900/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

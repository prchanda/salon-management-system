export default function ReviewsLoading() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="w-full max-w-xl">
            <div className="h-3 w-28 animate-pulse rounded bg-cream-200" />
            <div className="mt-4 h-12 w-3/4 animate-pulse rounded bg-cream-200" />
            <div className="mt-3 h-12 w-1/2 animate-pulse rounded bg-cream-200" />
            <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-cream-100" />
          </div>
          <div className="h-12 w-40 animate-pulse rounded-full bg-cream-200" />
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-900/10 bg-cream-50 p-6 shadow-soft"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-cream-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-cream-100" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-cream-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-cream-100" />
              <div className="mt-6 flex items-center justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-cream-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-cream-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BookLoading() {
  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <div className="h-3 w-28 animate-pulse rounded bg-cream-200" />
        <div className="mt-4 h-12 w-3/4 animate-pulse rounded bg-cream-200" />
        <div className="mt-5 h-4 w-full animate-pulse rounded bg-cream-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-cream-100" />

        <div className="mt-10 space-y-6">
          {/* Name + phone row */}
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 animate-pulse rounded bg-cream-200" />
                <div className="mt-2 h-12 w-full animate-pulse rounded-xl bg-cream-100" />
              </div>
            ))}
          </div>

          {/* Service + specialist selects */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-28 animate-pulse rounded bg-cream-200" />
              <div className="mt-2 h-12 w-full animate-pulse rounded-xl bg-cream-100" />
            </div>
          ))}

          {/* Date + time row */}
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 animate-pulse rounded bg-cream-200" />
                <div className="mt-2 h-12 w-full animate-pulse rounded-xl bg-cream-100" />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <div className="h-3 w-20 animate-pulse rounded bg-cream-200" />
            <div className="mt-2 h-24 w-full animate-pulse rounded-xl bg-cream-100" />
          </div>

          {/* Submit */}
          <div className="h-12 w-48 animate-pulse rounded-full bg-cream-200" />
        </div>
      </div>
    </section>
  );
}

export default function ServicesLoading() {
  return (
    <>
      {/* Header */}
      <section className="bg-cream-100">
        <div className="container-page py-20 sm:py-28">
          <div className="h-3 w-24 animate-pulse rounded bg-cream-200" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-cream-200" />
          <div className="mt-3 h-12 w-1/2 animate-pulse rounded bg-cream-200" />
          <div className="mt-6 h-4 w-full max-w-2xl animate-pulse rounded bg-cream-50" />
          <div className="mt-2 h-4 w-2/3 max-w-2xl animate-pulse rounded bg-cream-50" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="h-12 w-36 animate-pulse rounded-full bg-cream-200" />
            <div className="h-12 w-36 animate-pulse rounded-full bg-cream-50" />
          </div>
        </div>
      </section>

      {/* Service groups */}
      <section className="section">
        <div className="container-page space-y-24">
          {Array.from({ length: 2 }).map((_, g) => (
            <div key={g} className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="h-3 w-28 animate-pulse rounded bg-cream-200" />
                <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-cream-200" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-cream-100" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-cream-100" />
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="h-5 w-2/3 animate-pulse rounded bg-cream-200" />
                        <div className="h-5 w-16 animate-pulse rounded bg-cream-200" />
                      </div>
                      <div className="h-4 w-full animate-pulse rounded bg-cream-100" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-cream-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

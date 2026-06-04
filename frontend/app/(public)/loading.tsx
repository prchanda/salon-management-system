export default function HomeLoading() {
  return (
    <>
      {/* Hero */}
      <section className="bg-cream-50">
        <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="h-3 w-32 animate-pulse rounded bg-cream-200" />
            <div className="mt-6 h-14 w-3/4 animate-pulse rounded bg-cream-200" />
            <div className="mt-3 h-14 w-1/2 animate-pulse rounded bg-cream-200" />
            <div className="mt-6 h-4 w-full animate-pulse rounded bg-cream-100" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-cream-100" />

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-12 w-40 animate-pulse rounded-full bg-cream-200" />
              <div className="h-12 w-40 animate-pulse rounded-full bg-cream-100" />
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-ink-900/10 pt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 animate-pulse rounded bg-cream-100" />
                  <div className="mt-2 h-7 w-12 animate-pulse rounded bg-cream-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-7">
            <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-cream-200 sm:aspect-[5/6] lg:aspect-[4/5]" />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-ink-900/10 bg-cream-100">
        <div className="container-page grid gap-10 py-16 sm:grid-cols-3 sm:gap-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-8 w-10 animate-pulse rounded bg-cream-200" />
              <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-cream-200" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-cream-50" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-cream-50" />
            </div>
          ))}
        </div>
      </section>

      {/* Services preview */}
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="h-3 w-24 animate-pulse rounded bg-cream-200" />
            <div className="mt-4 h-9 w-3/4 animate-pulse rounded bg-cream-200" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-cream-100" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-cream-100" />
          </div>
          <div className="lg:col-span-8">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-cream-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-cream-100" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-cream-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

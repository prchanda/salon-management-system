export default function BlogPostLoading() {
  return (
    <article className="section">
      <div className="container-page max-w-5xl">
        <div className="h-3 w-24 animate-pulse rounded bg-cream-200" />

        <div className="mt-8 max-w-3xl space-y-5">
          <div className="h-3 w-20 animate-pulse rounded bg-cream-200" />
          <div className="h-12 w-full animate-pulse rounded bg-cream-200" />
          <div className="h-12 w-2/3 animate-pulse rounded bg-cream-200" />
          <div className="h-4 w-full animate-pulse rounded bg-cream-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-cream-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-cream-100" />
        </div>

        <div className="mt-10 aspect-[16/9] animate-pulse rounded-2xl bg-cream-200" />

        <div className="mt-10 max-w-3xl space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 animate-pulse rounded bg-cream-100 ${i % 4 === 3 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

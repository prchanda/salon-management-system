import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import { SubmitButton } from "@/components/SubmitButton";
import type { Review } from "@/lib/types";
import { approveReviewAction, deleteReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews — Mr. & Mrs. Cuts Salon",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, value));
  return (
    <span className="text-gold-600" aria-label={`${filled} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="text-ink-900/15">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export default async function ReceptionReviewsPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    approved?: string;
    deleted?: string;
  };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  let reviews: Review[] = [];
  let fetchError = false;
  try {
    reviews = await api.getAdminReviews();
  } catch {
    fetchError = true;
  }

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  const actionError =
    searchParams.error === "approve"
      ? "Could not approve that review. Please try again."
      : searchParams.error === "delete"
      ? "Could not remove that review. Please try again."
      : null;
  const justApproved = !!searchParams.approved;
  const justDeleted = !!searchParams.deleted;

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Moderation</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">Reviews</h1>
        <p className="mt-2 text-sm text-ink-600">
          Guest reviews are held here until you approve them. Approved reviews
          appear on the public reviews page and the home page.
        </p>
      </div>

      {fetchError && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          Could not load reviews. Is the backend running?
        </p>
      )}
      {actionError && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {justApproved && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Review approved — it&apos;s now live.
        </p>
      )}
      {justDeleted && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Review removed.
        </p>
      )}

      <Section
        title={`Pending approval (${pending.length})`}
        empty="No reviews waiting for approval."
        reviews={pending}
        kind="pending"
      />

      <Section
        title={`Published (${approved.length})`}
        empty="No published reviews yet."
        reviews={approved}
        kind="approved"
      />
    </div>
  );
}

function Section({
  title,
  empty,
  reviews,
  kind,
}: {
  title: string;
  empty: string;
  reviews: Review[];
  kind: "pending" | "approved";
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {reviews.length === 0 ? (
          <p className="rounded-2xl bg-cream-50 px-5 py-10 text-center text-sm text-ink-500 shadow-soft">
            {empty}
          </p>
        ) : (
          reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl bg-cream-50 p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-base text-ink-900">
                    {r.authorName}
                  </span>
                  <Stars value={r.rating} />
                </div>
                <span className="text-[11px] uppercase tracking-widest text-ink-500">
                  {fmtDate(r.createdAt)}
                  {r.guestSince ? ` · guest since ${r.guestSince}` : ""}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {r.quote}
              </p>

              <div className="mt-4 flex justify-end gap-3">
                {kind === "pending" && (
                  <form action={approveReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton
                      pendingText="Approving…"
                      className="rounded-md bg-ink-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50 hover:bg-ink-700"
                    >
                      Approve
                    </SubmitButton>
                  </form>
                )}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton
                    pendingText="Working…"
                    className="rounded-md border border-red-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-700 hover:bg-red-50"
                  >
                    {kind === "pending" ? "Reject" : "Remove"}
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

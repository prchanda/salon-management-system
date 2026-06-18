import { ReviewForm } from "@/components/ReviewForm";

export const metadata = {
  title: "Share your experience",
  description:
    "Tell us about your visit. Your words help other guests find us.",
  alternates: { canonical: "/reviews/new" },
};

export default function NewReviewPage() {
  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <span className="eyebrow">Your words</span>
        <h1 className="display mt-4">
          Share your <span className="italic text-gold-600">experience.</span>
        </h1>
        <p className="lead mt-5">
          A short note about your visit — the cut, the conversation, the calm.
          We&apos;ll feature it on our home page.
        </p>

        <div className="mt-10">
          <ReviewForm />
        </div>
      </div>
    </section>
  );
}

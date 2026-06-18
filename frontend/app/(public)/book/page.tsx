import { BookingForm } from "@/components/BookingForm";
import { api } from "@/lib/api";
import type { Service, Staff } from "@/lib/types";

export const metadata = {
  title: "Book an appointment",
  description:
    "Request your appointment online — choose a service, a date and time, and we'll call you to confirm.",
  alternates: { canonical: "/book" },
};

async function safeGetServices(): Promise<Service[]> {
  try {
    return await api.getServices();
  } catch {
    return [];
  }
}

async function safeGetStaff(): Promise<Staff[]> {
  try {
    return await api.getStaff();
  } catch {
    return [];
  }
}

export default async function BookPage() {
  const [services, staff] = await Promise.all([
    safeGetServices(),
    safeGetStaff(),
  ]);

  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <span className="eyebrow">Reserve your seat</span>
        <h1 className="display mt-4">
          Book an <span className="italic text-gold-600">appointment.</span>
        </h1>
        <p className="lead mt-5">
          Choose a service, pick a date and time, and we&apos;ll call you to
          confirm. Consultations are always complimentary.
        </p>

        <div className="mt-10">
          <BookingForm services={services} staff={staff} />
        </div>
      </div>
    </section>
  );
}

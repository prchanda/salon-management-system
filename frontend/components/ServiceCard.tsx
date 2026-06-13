import type { Service } from "@/lib/types";

interface Props {
  service: Service;
  showPrice?: boolean;
}

export function ServiceCard({ service, showPrice = true }: Props) {
  return (
    <article className="group flex h-full flex-col border-t border-ink-900/10 pt-6 transition">
      {service.imageUrl && (
        <div className="mb-5 overflow-hidden rounded-xl bg-cream-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={service.imageUrl}
            alt={service.serviceName}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl text-ink-900">
          {service.serviceName}
        </h3>
        {showPrice && (
          <span className="shrink-0 font-serif text-lg text-gold-600">
            ₹{service.price}
          </span>
        )}
      </div>
      {service.description && (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          {service.description}
        </p>
      )}
      <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-widest text-ink-500">
        <span>{service.durationMinutes} minutes</span>
      </div>
    </article>
  );
}

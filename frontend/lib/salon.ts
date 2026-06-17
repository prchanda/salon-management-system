// Salon contact details — single source of truth for public CTAs.
export const SALON = {
  name: "Mr. & Mrs. Cuts Salon",
  phone: "+91 7003232340",
  phoneDisplay: "+91 70032 32340",
  whatsapp: "917003232340", // wa.me uses no leading +
  whatsappPrefill: "Hi Mr. & Mrs. Cuts Salon, I'd like to book an appointment.",
  email: "paulswastika734@gmail.com",
  address: "157/2, Monihar Apartment (Ground Floor), Gostotala, Garia, Kolkata, India, West Bengal",
  mapsUrl: "https://maps.app.goo.gl/f9bZ9HotjV5Hp19w8",
  hours: "Mon – Sun · 11:00 AM — 9:00 PM (Thu\u00A0closed)",
  instagram: "https://www.instagram.com/mr_mrs_cuts_/",
  facebook: "https://www.facebook.com/mrandmrscuts",
};

export function waLink(
  message = SALON.whatsappPrefill,
  phone: string = SALON.whatsapp
) {
  // wa.me requires a digits-only number (no +, spaces, or dashes)
  const sanitized = phone.replace(/\D/g, "");
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

export function telLink() {
  // tel: URIs per RFC 3966 only allow digits, +, -, . — strip everything else
  const sanitized = SALON.phone.replace(/[^\d+]/g, "");
  return `tel:${sanitized}`;
}

// Canonical staff job roles. Must stay in sync with the backend catalogue in
// backend/Helpers/SalonRoles.cs. Staff pick one or more from this list.
export const SALON_ROLES = [
  "Hair Stylist",
  "Barber",
  "Colorist",
  "Beautician",
  "Makeup Artist",
  "Nail Technician",
  "Esthetician",
  "Massage Therapist",
  "Spa Therapist",
] as const;

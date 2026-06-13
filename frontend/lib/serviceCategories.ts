// Canonical service categories used to group the public services menu.
// Keep in sync with backend/Helpers/ServiceCategories.cs.

export interface ServiceCategory {
  /** Stored value (matches Service.category in the DB). */
  value: string;
  /** Heading shown on the public services page. */
  label: string;
  tagline: string;
  blurb: string;
}

export const DEFAULT_SERVICE_CATEGORY = "Add-ons";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    value: "Hair",
    label: "Hair",
    tagline: "Cuts, colour and care",
    blurb:
      "Precision cuts, considered colour and restorative care, shaped to your hair's natural pattern.",
  },
  {
    value: "Skin",
    label: "Skin",
    tagline: "Facials and clinical care",
    blurb:
      "Bespoke facials and targeted treatments using professional-grade actives — calming, brightening and resurfacing.",
  },
  {
    value: "Nails",
    label: "Nails",
    tagline: "Manicures and pedicures",
    blurb:
      "Meticulous shaping, conditioning and long-wear finishes. Tools are sanitised between every guest.",
  },
  {
    value: "Spa",
    label: "Spa",
    tagline: "Body, massage and rituals",
    blurb:
      "Quiet, unhurried treatments designed to release tension and restore — from therapeutic massage to body rituals.",
  },
  {
    value: "Add-ons",
    label: "Signature add-ons",
    tagline: "Finishing touches",
    blurb:
      "Small finishing touches that elevate any service. Mention these when you book and we'll set aside the time.",
  },
];

/** Just the stored values, for form dropdowns and validation. */
export const SERVICE_CATEGORY_VALUES = SERVICE_CATEGORIES.map((c) => c.value);

import type { Category } from "@/lib/db/schema";

export interface CategoryMeta {
  slug: Category;
  label: string;
  blurb: string;
  image: string;
  /** Tailwind classes for the category's accent surface. */
  accent: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  tropicals: {
    slug: "tropicals",
    label: "Tropicals",
    blurb: "Big leaves for bright rooms.",
    image: "/products/tropicals.svg",
    accent: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
  succulents: {
    slug: "succulents",
    label: "Succulents",
    blurb: "Sun lovers that forgive forgetting.",
    image: "/products/succulents.svg",
    accent: "bg-lime-50 text-lime-900 ring-lime-200",
  },
  planters: {
    slug: "planters",
    label: "Planters",
    blurb: "Hand-thrown pots and baskets.",
    image: "/products/planters.svg",
    accent: "bg-orange-50 text-orange-900 ring-orange-200",
  },
  tools: {
    slug: "tools",
    label: "Tools",
    blurb: "The kit for routine care.",
    image: "/products/tools.svg",
    accent: "bg-slate-100 text-slate-900 ring-slate-200",
  },
  rare: {
    slug: "rare",
    label: "Rare finds",
    blurb: "Collector plants, propagated in-house.",
    image: "/products/rare.svg",
    accent: "bg-violet-50 text-violet-900 ring-violet-200",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_META);

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CARE_LABELS = {
  light: { low: "Low light", medium: "Medium light", bright: "Bright light" },
  water: { low: "Water rarely", medium: "Water weekly", high: "Keep moist" },
  difficulty: { easy: "Easy care", moderate: "Some attention", expert: "Experienced growers" },
} as const;

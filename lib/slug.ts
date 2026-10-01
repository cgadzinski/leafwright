/** URL-safe slug: lowercase, apostrophes dropped, everything else collapsed to dashes. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

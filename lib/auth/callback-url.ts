/** Only same-origin paths are honored as a post-sign-in destination. */
export function safeCallbackUrl(value: string | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

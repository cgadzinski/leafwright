export const ANALYTICS_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]["value"];

export function parseAnalyticsRange(value: string | string[] | undefined): AnalyticsRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return ANALYTICS_RANGES.some((range) => range.value === candidate)
    ? (candidate as AnalyticsRange)
    : "30";
}

import { z } from "zod";
import { OrderStatusSchema } from "@/lib/db/schema";

const DateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

export const OrderFiltersSchema = z.object({
  status: OrderStatusSchema.optional(),
  from: DateParam,
  to: DateParam,
});

export type OrderFilters = z.infer<typeof OrderFiltersSchema>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads `?status=&from=&to=` leniently: bad values are dropped rather than rejected. */
export function parseOrderFilters(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): OrderFilters {
  const get = (key: string) =>
    params instanceof URLSearchParams ? (params.get(key) ?? undefined) : first(params[key]);
  const status = OrderStatusSchema.safeParse(get("status"));
  const from = DateParam.safeParse(get("from"));
  const to = DateParam.safeParse(get("to"));
  return {
    status: status.success ? status.data : undefined,
    from: from.success ? from.data : undefined,
    to: to.success ? to.data : undefined,
  };
}

/** Converts the date strings to an inclusive range in UTC. */
export function filterRange(filters: OrderFilters): { from?: Date; to?: Date } {
  return {
    from: filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : undefined,
    to: filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : undefined,
  };
}

export function filtersToQuery(filters: OrderFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const search = params.toString();
  return search ? `?${search}` : "";
}

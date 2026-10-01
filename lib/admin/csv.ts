import { formatMoney } from "@/lib/commerce/cart";
import type { Order } from "@/lib/db/schema";

export function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}

export const ORDER_CSV_HEADERS = [
  "order_number",
  "placed_at",
  "status",
  "customer_name",
  "customer_email",
  "items",
  "subtotal",
  "discount",
  "shipping",
  "tax",
  "total",
  "promo_code",
  "shipping_method",
  "tracking_number",
];

export function ordersToCsv(orders: Order[], customerEmail: (order: Order) => string): string {
  return toCsv([
    ORDER_CSV_HEADERS,
    ...orders.map((order) => [
      order.number,
      order.placedAt,
      order.status,
      order.shippingAddress.name,
      customerEmail(order),
      order.lines.reduce((sum, line) => sum + line.quantity, 0),
      formatMoney(order.subtotal),
      formatMoney(order.discount),
      formatMoney(order.shipping),
      formatMoney(order.tax),
      formatMoney(order.total),
      order.promoCode ?? "",
      order.shippingMethod,
      order.trackingNumber ?? "",
    ]),
  ]);
}

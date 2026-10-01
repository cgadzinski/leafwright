import type { Cart, Order, Product } from "@/lib/db/schema";

export interface Kpi {
  value: number;
  previous: number;
  /** Relative change from the previous period, or null when there is no baseline. */
  change: number | null;
}

export interface StoreKpis {
  revenue: Kpi;
  orders: Kpi;
  aov: Kpi;
  conversion: Kpi;
  windowDays: number;
}

const DAY = 24 * 60 * 60 * 1000;

function change(value: number, previous: number): number | null {
  if (previous === 0) return value === 0 ? 0 : null;
  return (value - previous) / previous;
}

function inWindow(order: Order, from: number, to: number): boolean {
  const t = new Date(order.placedAt).getTime();
  return t >= from && t < to;
}

const counts = (orders: Order[]) => orders.filter((order) => order.status !== "refunded");

/**
 * Trailing-window KPIs for one store versus the window before it. Conversion is checkout
 * conversion: orders placed over orders plus carts still holding this store's products.
 */
export function computeStoreKpis(
  orders: Order[],
  carts: Cart[],
  products: Product[],
  now: Date = new Date(),
  windowDays = 30,
): StoreKpis {
  const end = now.getTime();
  const start = end - windowDays * DAY;
  const previousStart = start - windowDays * DAY;

  const current = counts(orders.filter((order) => inWindow(order, start, end)));
  const previous = counts(orders.filter((order) => inWindow(order, previousStart, start)));

  const revenue = (list: Order[]) => list.reduce((sum, order) => sum + order.total, 0);
  const aov = (list: Order[]) => (list.length ? Math.round(revenue(list) / list.length) : 0);

  const storeProductIds = new Set(products.map((product) => product.id));
  const openCarts = carts.filter(
    (cart) =>
      cart.lines.some((line) => storeProductIds.has(line.productId)) &&
      new Date(cart.updatedAt).getTime() >= start,
  ).length;
  const conversion = current.length + openCarts ? current.length / (current.length + openCarts) : 0;

  return {
    windowDays,
    revenue: {
      value: revenue(current),
      previous: revenue(previous),
      change: change(revenue(current), revenue(previous)),
    },
    orders: {
      value: current.length,
      previous: previous.length,
      change: change(current.length, previous.length),
    },
    aov: {
      value: aov(current),
      previous: aov(previous),
      change: change(aov(current), aov(previous)),
    },
    conversion: { value: conversion, previous: 1, change: null },
  };
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

/** Revenue per day for the trailing window, oldest first, with empty days filled in. */
export function dailyRevenue(orders: Order[], now: Date, days: number): DailyRevenue[] {
  const out = new Map<string, DailyRevenue>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * DAY).toISOString().slice(0, 10);
    out.set(date, { date, revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    if (order.status === "refunded") continue;
    const date = order.placedAt.slice(0, 10);
    const bucket = out.get(date);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }
  return [...out.values()];
}

export interface ProductSales {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}

export function topProducts(orders: Order[], limit = 5): ProductSales[] {
  const totals = new Map<string, ProductSales>();
  for (const order of orders) {
    if (order.status === "refunded") continue;
    for (const line of order.lines) {
      const entry = totals.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        units: 0,
        revenue: 0,
      };
      entry.units += line.quantity;
      entry.revenue += line.unitPrice * line.quantity;
      totals.set(line.productId, entry);
    }
  }
  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/** Median hours from order to fulfillment for orders that have shipped. */
export function medianFulfillmentHours(orders: Order[]): number | null {
  const hours = orders
    .filter((order) => order.fulfilledAt)
    .map(
      (order) =>
        (new Date(order.fulfilledAt!).getTime() - new Date(order.placedAt).getTime()) / 36e5,
    )
    .sort((a, b) => a - b);
  if (!hours.length) return null;
  const mid = Math.floor(hours.length / 2);
  return hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
}

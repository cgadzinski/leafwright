import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dailyRevenue, medianFulfillmentHours, topProducts } from "@/lib/admin/kpis";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { FLAGS } from "@/lib/flags.config";
import { isFlagEnabled } from "@/lib/flags.server";
import { parseAnalyticsRange } from "@/lib/admin/ranges";
import { RangeSelect } from "./range-select";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const { store } = await requireMerchant("/admin/analytics");
  const enabled = await isFlagEnabled(FLAGS.MERCHANT_ANALYTICS, store.plan);

  if (!enabled) {
    return (
      <>
        <PageHeader title="Analytics" />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>See what sells and why</CardTitle>
            <CardDescription>
              Daily revenue, top products, and fulfillment speed are part of the Pro plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/settings/billing" data-testid="analytics-upgrade">
                Compare plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const { range } = await searchParams;
  const rangeValue = parseAnalyticsRange(range);
  const days = Number(rangeValue);
  const now = new Date();
  const from = new Date(now.getTime() - days * 864e5);
  const orders = await db.orders.list({ storeId: store.id, from });
  const series = dailyRevenue(orders, now, days);
  const max = Math.max(1, ...series.map((point) => point.revenue));
  const total = series.reduce((sum, point) => sum + point.revenue, 0);
  const top = topProducts(orders);
  const median = medianFulfillmentHours(orders);

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${formatMoney(total)} across ${orders.filter((o) => o.status !== "refunded").length} orders`}
        actions={
          <Suspense>
            <RangeSelect value={rangeValue} />
          </Suspense>
        }
      />
      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Daily revenue</h2>
        <div
          className="mt-4 flex h-48 items-end gap-[2px]"
          role="img"
          aria-label="Daily revenue bar chart"
        >
          {series.map((point) => (
            <div
              key={point.date}
              className="flex-1 rounded-t bg-emerald-600"
              style={{ height: `${Math.max(2, (point.revenue / max) * 100)}%` }}
              title={`${point.date}: ${formatMoney(point.revenue)} from ${point.orders} order${point.orders === 1 ? "" : "s"}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{series[0]?.date}</span>
          <span>{series.at(-1)?.date}</span>
        </div>
      </section>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="font-medium">Top products</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {top.map((product, index) => (
              <li key={product.productId} className="flex justify-between">
                <span>
                  {index + 1}. {product.name}{" "}
                  <span className="text-muted-foreground">× {product.units}</span>
                </span>
                <span>{formatMoney(product.revenue)}</span>
              </li>
            ))}
            {top.length === 0 ? (
              <li className="text-muted-foreground">No sales in this range.</li>
            ) : null}
          </ol>
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="font-medium">Fulfillment</h2>
          <p className="mt-3 text-3xl font-semibold">
            {median === null ? "—" : `${(median / 24).toFixed(1)} days`}
          </p>
          <p className="text-sm text-muted-foreground">Median time from order to shipment.</p>
        </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AskAssistantButton } from "@/components/admin/ask-assistant-button";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeStoreKpis, type Kpi } from "@/lib/admin/kpis";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function Change({ kpi }: { kpi: Kpi }) {
  if (kpi.change === null)
    return <span className="text-xs text-muted-foreground">No prior period</span>;
  const pct = Math.round(kpi.change * 100);
  return (
    <span className={cn("text-xs", pct >= 0 ? "text-emerald-700" : "text-rose-700")}>
      {pct >= 0 ? "+" : ""}
      {pct}% vs prior 30 days
    </span>
  );
}

export default async function AdminDashboardPage() {
  const { store } = await requireMerchant();
  const [orders, products, carts] = await Promise.all([
    db.orders.list({ storeId: store.id }),
    db.products.list({ storeId: store.id, status: "all" }),
    db.carts.listAll(),
  ]);
  const kpis = computeStoreKpis(orders, carts, products);
  const recent = orders.slice(0, 8);

  const tiles = [
    { key: "revenue", label: "Revenue", value: formatMoney(kpis.revenue.value), kpi: kpis.revenue },
    { key: "orders", label: "Orders", value: String(kpis.orders.value), kpi: kpis.orders },
    { key: "aov", label: "Average order", value: formatMoney(kpis.aov.value), kpi: kpis.aov },
    {
      key: "conversion",
      label: "Checkout conversion",
      value: `${Math.round(kpis.conversion.value * 100)}%`,
      kpi: kpis.conversion,
    },
  ] as const;

  return (
    <>
      <PageHeader
        title={`Good day, ${store.name}`}
        description="Last 30 days at a glance."
        actions={<AskAssistantButton />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.key} data-testid={`admin-kpi-${tile.key}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tile.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{tile.value}</p>
              {tile.key === "conversion" ? (
                <span className="text-xs text-muted-foreground">Orders ÷ orders + open carts</span>
              ) : (
                <Change kpi={tile.kpi} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm underline">
            All orders
          </Link>
        </div>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="font-medium underline">
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell>{new Date(order.placedAt).toLocaleDateString("en-US")}</TableCell>
                <TableCell>{order.shippingAddress.name}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { filterRange, filtersToQuery, parseOrderFilters } from "@/lib/admin/order-filters";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db, OrderStatusSchema } from "@/lib/db";
import { StatusFilter } from "../products/status-filter";
import { DateRangeFilter } from "./date-range";

export const metadata: Metadata = { title: "Orders" };

const STATUS_OPTIONS = OrderStatusSchema.options.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { store } = await requireMerchant("/admin/orders");
  const filters = parseOrderFilters(await searchParams);
  const orders = await db.orders.list({
    storeId: store.id,
    status: filters.status,
    ...filterRange(filters),
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
        actions={
          <Suspense>
            <StatusFilter options={STATUS_OPTIONS} testId="orders-status" />
            <DateRangeFilter testId="orders-date-range" />
            <Button asChild variant="outline">
              <a
                href={`/admin/orders/export${filtersToQuery(filters)}`}
                download
                data-testid="orders-export"
              >
                Export CSV
              </a>
            </Button>
          </Suspense>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium underline"
                  data-testid={`orders-row-${order.id}`}
                >
                  {order.number}
                </Link>
              </TableCell>
              <TableCell>{new Date(order.placedAt).toLocaleDateString("en-US")}</TableCell>
              <TableCell>
                {order.shippingAddress.name}
                {order.guestEmail ? <span className="text-muted-foreground"> · guest</span> : null}
              </TableCell>
              <TableCell>{order.lines.reduce((sum, line) => sum + line.quantity, 0)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
            </TableRow>
          ))}
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No orders match these filters.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </>
  );
}

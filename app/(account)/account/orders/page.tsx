import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABELS, ordersForUser } from "@/lib/orders/history";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Faccount%2Forders");
  const [orders, stores] = await Promise.all([ordersForUser(session.user), db.stores.list()]);
  const storeName = new Map(stores.map((store) => [store.id, store.name]));

  return (
    <main className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No orders yet.{" "}
          <Link href="/products" className="underline">
            Start with something easy to grow.
          </Link>
        </p>
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Nursery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/account/orders/${order.number}`}
                    className="font-medium underline"
                    data-testid={`account-order-${order.number}`}
                  >
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell>{new Date(order.placedAt).toLocaleDateString("en-US")}</TableCell>
                <TableCell>{storeName.get(order.storeId)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}

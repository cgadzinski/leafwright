import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { emailFromGuestId, ordersForCustomer } from "@/lib/admin/customers";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const { store } = await requireMerchant(`/admin/customers/${id}`);
  const storeOrders = await db.orders.list({ storeId: store.id });
  const orders = ordersForCustomer(storeOrders, id);
  if (orders.length === 0) notFound();

  const guestEmail = emailFromGuestId(id);
  const user = guestEmail ? undefined : await db.users.getById(id);
  if (!guestEmail && !user) notFound();
  const name = user?.name ?? orders[0].shippingAddress.name;
  const email = user?.email ?? guestEmail ?? "";
  const spent = orders.filter((o) => o.status !== "refunded").reduce((sum, o) => sum + o.total, 0);
  const addresses = user ? await db.addresses.listByUser(user.id) : [];

  return (
    <>
      <Link href="/admin/customers" className="text-sm text-muted-foreground hover:underline">
        ← Customers
      </Link>
      <PageHeader title={name} description={`${email}${user ? "" : " · guest"}`} />
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-3 font-medium">Orders with {store.name}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium underline">
                      {order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(order.placedAt).toLocaleDateString("en-US")}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground">Lifetime with your store</p>
            <p className="text-xl font-semibold">{formatMoney(spent)}</p>
            <p className="text-muted-foreground">
              {orders.length} order{orders.length === 1 ? "" : "s"}
            </p>
          </div>
          {user ? (
            <div className="rounded-xl border p-4">
              <p className="text-muted-foreground">Details</p>
              <p className="mt-1">{user.phone ?? "No phone on file"}</p>
              <p className="text-muted-foreground">
                Member since {new Date(user.createdAt).toLocaleDateString("en-US")}
              </p>
              {addresses.length ? (
                <ul className="mt-3 space-y-2">
                  {addresses.map((address) => (
                    <li key={address.id} className="text-muted-foreground">
                      <span className="text-foreground">{address.label}:</span> {address.line1},{" "}
                      {address.city}, {address.region} {address.postalCode}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { guestCustomerId } from "@/lib/admin/customers";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { hasRefundRequest } from "@/lib/orders/history";
import { FulfillmentControls, NoteForm } from "./order-controls";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const { store } = await requireMerchant(`/admin/orders/${id}`);
  const order = await db.orders.getById(id);
  if (!order || order.storeId !== store.id) notFound();
  const customer = order.customerId ? await db.users.getById(order.customerId) : undefined;
  const email = customer?.email ?? order.guestEmail ?? "";
  const customerHref = customer
    ? `/admin/customers/${customer.id}`
    : order.guestEmail
      ? `/admin/customers/${guestCustomerId(order.guestEmail)}`
      : undefined;
  const authors = new Map(
    (
      await Promise.all(
        [...new Set(order.notes.map((n) => n.authorId))].map((authorId) =>
          db.users.getById(authorId),
        ),
      )
    )
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => [u.id, u.name]),
  );

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
        ← Orders
      </Link>
      <PageHeader
        title={order.number}
        description={`Placed ${new Date(order.placedAt).toLocaleString("en-US")} · ${order.shippingMethod} shipping${order.source === "bot" ? " · automated" : ""}`}
        actions={<OrderStatusBadge status={order.status} />}
      />
      {hasRefundRequest(order) && order.status !== "refunded" ? (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
          The customer has requested a refund. See the notes below.
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-xl border p-5">
            <h2 className="font-medium">Items</h2>
            <ul className="mt-3 divide-y text-sm">
              {order.lines.map((line) => (
                <li
                  key={`${line.productId}-${line.variantId ?? ""}`}
                  className="flex justify-between py-2"
                >
                  <span>
                    {line.quantity} × {line.name}
                    {line.variantLabel ? ` (${line.variantLabel})` : ""}
                  </span>
                  <span>{formatMoney(line.unitPrice * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {order.discount ? (
                <div className="flex justify-between">
                  <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                  <dd>−{formatMoney(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatMoney(order.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="font-medium">Notes</h2>
            {order.notes.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {order.notes.map((note) => (
                  <li key={note.id} className="rounded-md bg-muted/50 p-3">
                    <p>{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {authors.get(note.authorId) ?? "Customer"} ·{" "}
                      {new Date(note.createdAt).toLocaleString("en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <NoteForm orderId={order.id} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border p-5 text-sm">
            <h2 className="font-medium">Customer</h2>
            <p className="mt-2">
              {customerHref ? (
                <Link href={customerHref} className="underline">
                  {customer?.name ?? order.shippingAddress.name}
                </Link>
              ) : (
                order.shippingAddress.name
              )}
              {!customer ? <span className="text-muted-foreground"> (guest)</span> : null}
            </p>
            <p className="text-muted-foreground">{email}</p>
            {order.shippingAddress.phone ? (
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
            ) : null}
            <address className="mt-3 text-muted-foreground not-italic">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
              {order.shippingAddress.postalCode}
            </address>
          </section>
          <section className="rounded-xl border p-5">
            <h2 className="mb-3 font-medium">Fulfillment</h2>
            {order.fulfilledAt ? (
              <p className="mb-3 text-sm text-muted-foreground">
                Fulfilled {new Date(order.fulfilledAt).toLocaleString("en-US")}
                {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
              </p>
            ) : null}
            <FulfillmentControls
              orderId={order.id}
              status={order.status}
              trackingNumber={order.trackingNumber}
            />
          </section>
        </aside>
      </div>
    </>
  );
}

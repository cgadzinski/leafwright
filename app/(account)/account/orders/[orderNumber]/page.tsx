import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { hasRefundRequest, ORDER_STATUS_LABELS, orderBelongsTo } from "@/lib/orders/history";
import { RefundRequestForm, ReorderButton } from "./order-actions";

export const metadata: Metadata = { title: "Order" };

export default async function AccountOrderPage({
  params,
}: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const session = await auth();
  if (!session?.user)
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);
  const order = await db.orders.getByNumber(orderNumber);
  if (!order || !orderBelongsTo(order, session.user)) notFound();
  const store = await db.stores.getById(order.storeId);

  const refundDisabled =
    order.status === "refunded"
      ? "This order has been refunded."
      : hasRefundRequest(order)
        ? "Refund requested. The nursery will follow up by email."
        : undefined;

  return (
    <main className="mt-6 max-w-3xl">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:underline">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{order.number}</h1>
        <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {new Date(order.placedAt).toLocaleString("en-US")} · {store?.name}
        {order.trackingNumber ? ` · Tracking ${order.trackingNumber}` : ""}
      </p>

      <section className="mt-6 rounded-xl border p-6">
        <ul className="divide-y text-sm">
          {order.lines.map((line) => (
            <li
              key={`${line.productId}-${line.variantId ?? ""}`}
              className="flex justify-between py-2"
            >
              <span>
                {line.quantity} ×{" "}
                <Link href={`/products/${line.slug}`} className="underline">
                  {line.name}
                </Link>
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
            <div className="flex justify-between text-emerald-700">
              <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
              <dd>−{formatMoney(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt>Shipping ({order.shippingMethod})</dt>
            <dd>{order.shipping ? formatMoney(order.shipping) : "Free"}</dd>
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
        <address className="mt-4 text-sm text-muted-foreground not-italic">
          {order.shippingAddress.name}
          <br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
          {order.shippingAddress.postalCode}
        </address>
      </section>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-medium">Buy it again</h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            Adds every available item from this order to your cart.
          </p>
          <ReorderButton orderNumber={order.number} />
        </div>
        <div>
          <h2 className="font-medium">Need help with this order?</h2>
          <div className="mt-3">
            <RefundRequestForm orderNumber={order.number} disabledReason={refundDisabled} />
          </div>
        </div>
      </section>
    </main>
  );
}

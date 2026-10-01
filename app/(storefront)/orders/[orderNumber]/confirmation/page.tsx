import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { canViewOrder } from "@/lib/orders/access";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ConfirmationPage({
  params,
}: PageProps<"/orders/[orderNumber]/confirmation">) {
  const { orderNumber } = await params;
  const order = await db.orders.getByNumber(orderNumber);
  if (!order) notFound();
  const session = await auth();
  if (!(await canViewOrder(order, session))) notFound();

  const store = await db.stores.getById(order.storeId);
  const siblings = (
    await db.orders.list(
      order.customerId ? { customerId: order.customerId } : { guestEmail: order.guestEmail },
    )
  ).filter((other) => other.id !== order.id && other.placedAt === order.placedAt);
  const email = order.guestEmail ?? session?.user?.email;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <p className="text-sm font-medium text-emerald-700">Order confirmed</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Thanks, {order.shippingAddress.name.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-muted-foreground">
        Order <span className="font-medium text-foreground">{order.number}</span> from {store?.name}{" "}
        is on its way to being packed.{email ? ` A receipt is headed to ${email}.` : ""}
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <ul className="divide-y text-sm">
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
            <div className="flex justify-between text-emerald-700">
              <dt>Discount {order.promoCode ? `(${order.promoCode})` : ""}</dt>
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

      {siblings.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Items from other nurseries ship separately:{" "}
          {siblings.map((other, index) => (
            <span key={other.id}>
              {index ? ", " : ""}
              <Link href={`/orders/${other.number}/confirmation`} className="underline">
                {other.number}
              </Link>
            </span>
          ))}
          .
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/products" data-testid="confirmation-continue">
            Continue shopping
          </Link>
        </Button>
        {session?.user && order.customerId === session.user.id ? (
          <Button asChild variant="outline">
            <Link href={`/account/orders/${order.number}`} data-testid="confirmation-view-order">
              View order
            </Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}

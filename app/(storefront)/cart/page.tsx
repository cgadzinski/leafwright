import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import { getCart, priceStoredCart } from "@/lib/cart/server";
import { formatMoney } from "@/lib/commerce/cart";
import { describePromo } from "@/lib/commerce/promo";
import { db } from "@/lib/db";
import { CartLineControls } from "./cart-line";
import { PromoForm } from "./promo-form";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getCart();
  const { totals, promo } = await priceStoredCart(cart);
  const stores = await db.stores.list();
  const storeName = new Map(stores.map((store) => [store.id, store.name]));

  if (totals.itemCount === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Find something green to bring home.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse the shop</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section className="space-y-8">
          {totals.groups.map((group) => (
            <div key={group.storeId}>
              <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {storeName.get(group.storeId)}
              </h2>
              <ul className="mt-3 divide-y">
                {group.lines.map(({ line, product, variant, unitPrice, lineTotal }) => (
                  <li key={product.id} className="flex gap-4 py-4">
                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      className="h-24 w-24 shrink-0"
                      sizes="96px"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {variant ? `${variant.label} · ` : ""}
                        {formatMoney(unitPrice)} each
                      </p>
                      <CartLineControls
                        productId={product.id}
                        slug={product.slug}
                        quantity={line.quantity}
                      />
                    </div>
                    <p className="font-medium">{formatMoney(lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {totals.unavailable.length ? (
            <p className="text-sm text-muted-foreground">
              {totals.unavailable.length} item(s) are no longer available and were left out.
            </p>
          ) : null}
        </section>

        <aside className="h-fit rounded-xl border p-6">
          <h2 className="font-semibold">Summary</h2>
          <PromoForm
            appliedCode={cart.promoCode}
            appliedDescription={promo ? describePromo(promo) : undefined}
          />
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            {totals.discount ? (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatMoney(totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt>Shipping (standard)</dt>
              <dd>{totals.shipping ? formatMoney(totals.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Estimated tax</dt>
              <dd>{formatMoney(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout" data-testid="cart-checkout">
              Checkout
            </Link>
          </Button>
        </aside>
      </div>
    </main>
  );
}

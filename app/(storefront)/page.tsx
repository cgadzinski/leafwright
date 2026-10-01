import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LIST } from "@/lib/catalog";
import { describePromo, evaluatePromo } from "@/lib/commerce/promo";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default async function HomePage() {
  const [products, stores, promos] = await Promise.all([
    db.products.list({ sort: "newest" }),
    db.stores.list(),
    db.promos.list(),
  ]);
  const storeName = new Map(stores.map((store) => [store.id, store.name]));
  const featured = products.filter((product) => product.compareAtPrice).slice(0, 4);
  const filler = products
    .filter((product) => !featured.includes(product))
    .slice(0, 8 - featured.length);
  const featuredProducts = [...featured, ...filler];
  const activePromo = promos.find((promo) => evaluatePromo(promo).ok);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
      <section className="py-12 md:py-16">
        <p className="text-sm font-medium text-emerald-700">Independent nurseries, one checkout</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Plants grown by people who know them.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Tropicals, succulents, planters, and care tools from four small nurseries, shipped
          straight from their benches.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild size="lg">
            <Link href="/products">Shop everything</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/help">Help me choose</Link>
          </Button>
        </div>
      </section>

      {activePromo ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-emerald-900 px-6 py-5 text-emerald-50">
          <div>
            <p className="text-sm uppercase opacity-80">{storeName.get(activePromo.storeId)}</p>
            <p className="text-lg font-medium">
              {describePromo(activePromo)} with code {activePromo.code}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/promo/${activePromo.code}`} data-testid="home-promo-cta">
              Apply code
            </Link>
          </Button>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Shop by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          {CATEGORY_LIST.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className={cn(
                "flex flex-col gap-3 rounded-xl p-4 ring-1 transition hover:shadow-md",
                category.accent,
              )}
              data-testid={`home-category-${category.slug}`}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={category.image} alt="" fill unoptimized className="object-cover" />
              </div>
              <div>
                <p className="font-medium">{category.label}</p>
                <p className="text-xs opacity-80">{category.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Featured this week</h2>
          <Link href="/products" className="text-sm hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeName={storeName.get(product.storeId)}
              testIdPrefix="home-featured"
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">The nurseries</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/stores/${store.slug}`} className="hover:underline">
                    {store.name}
                  </Link>
                </CardTitle>
                <CardDescription>{store.region}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {store.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

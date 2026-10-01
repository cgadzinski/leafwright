import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ProductCard } from "@/components/storefront/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { quickAddToCart } from "../../cart/actions";
import { followStore } from "./actions";

export async function generateMetadata({ params }: PageProps<"/stores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await db.stores.getBySlug(slug);
  return { title: store?.name ?? "Store" };
}

export default async function StorePage({ params }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const store = await db.stores.getBySlug(slug);
  if (!store) notFound();
  const [products, session] = await Promise.all([db.products.list({ storeId: store.id }), auth()]);
  const user = session?.user ? await db.users.getById(session.user.id) : undefined;
  const following = user?.followedStoreIds.includes(store.id) ?? false;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline">{store.region}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{store.name}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{store.description}</p>
        </div>
        <form action={followStore}>
          <input type="hidden" name="storeId" value={store.id} />
          <input type="hidden" name="slug" value={store.slug} />
          <Button
            type="submit"
            variant={following ? "secondary" : "default"}
            data-testid="store-follow"
          >
            {following ? "Following" : "Follow store"}
          </Button>
        </form>
      </div>
      <h2 className="mt-10 text-xl font-semibold">Products from {store.name}</h2>
      <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            testIdPrefix="catalog-card"
            quickAddAction={quickAddToCart}
          />
        ))}
      </div>
    </main>
  );
}

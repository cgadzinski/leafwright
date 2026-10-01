import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { quickAddToCart } from "../cart/actions";
import { CatalogView } from "./catalog-view";

export const metadata: Metadata = { title: "Shop" };

export default async function CatalogPage() {
  const [products, stores] = await Promise.all([db.products.list(), db.stores.list()]);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading the catalog…</p>}>
        <CatalogView products={products} stores={stores} quickAddAction={quickAddToCart} />
      </Suspense>
    </main>
  );
}

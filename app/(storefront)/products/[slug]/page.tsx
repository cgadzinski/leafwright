import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Price } from "@/components/storefront/price";
import { ProductImage } from "@/components/storefront/product-image";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_META } from "@/lib/catalog";
import { db } from "@/lib/db";
import { addToCart } from "../../cart/actions";
import { ProductTabs } from "./product-tabs";
import { PurchaseForm } from "./purchase-form";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.products.getBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await db.products.getBySlug(slug);
  if (!product || product.status !== "published") notFound();
  const store = await db.stores.getById(product.storeId);
  if (!store) notFound();
  const meta = CATEGORY_META[product.category];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:underline">
          Shop
        </Link>{" "}
        /{" "}
        <Link href={`/products?category=${product.category}`} className="hover:underline">
          {meta.label}
        </Link>
      </nav>
      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <ProductImage
          src={product.images[0] ?? meta.image}
          alt={product.name}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
        <div>
          <Badge variant="secondary">{meta.label}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grown by{" "}
            <Link href={`/stores/${store.slug}`} className="underline" data-testid="pdp-store-link">
              {store.name}
            </Link>{" "}
            · {store.region}
          </p>
          <Price
            cents={product.price}
            compareAt={product.compareAtPrice}
            className="mt-4 text-2xl"
          />
          <PurchaseForm product={product} action={addToCart} />
          <ProductTabs product={product} store={store} />
        </div>
      </div>
    </main>
  );
}

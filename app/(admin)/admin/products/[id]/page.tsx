import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { requireMerchant } from "@/lib/auth/merchant";
import { db } from "@/lib/db";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { saved, published } = await searchParams;
  const { store } = await requireMerchant(`/admin/products/${id}`);
  const product = await db.products.getById(id);
  if (!product || product.storeId !== store.id) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline">
        ← Products
      </Link>
      <PageHeader
        title={product.name}
        description={
          product.status === "published" ? (
            <>
              Live at{" "}
              <Link href={`/products/${product.slug}`} className="underline">
                /products/{product.slug}
              </Link>
            </>
          ) : undefined
        }
        actions={<ProductStatusBadge status={product.status} />}
      />
      {saved ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          Saved.
        </p>
      ) : null}
      {published ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          Published to the storefront.
        </p>
      ) : null}
      <ProductForm key={product.status} product={product} />
    </>
  );
}

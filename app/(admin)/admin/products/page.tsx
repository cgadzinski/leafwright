import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireMerchant } from "@/lib/auth/merchant";
import { CATEGORY_META } from "@/lib/catalog";
import { formatMoney } from "@/lib/commerce/cart";
import { db, ProductStatusSchema } from "@/lib/db";
import { StatusFilter } from "./status-filter";

export const metadata: Metadata = { title: "Products" };

const STATUS_OPTIONS = ProductStatusSchema.options.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { store } = await requireMerchant("/admin/products");
  const { status } = await searchParams;
  const parsed = ProductStatusSchema.safeParse(status);
  const products = (
    await db.products.list({
      storeId: store.id,
      status: parsed.success ? parsed.data : "all",
      sort: "newest",
    })
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Suspense>
              <StatusFilter options={STATUS_OPTIONS} testId="products-status" />
            </Suspense>
            <Button asChild>
              <Link href="/admin/products/new" data-testid="products-new">
                New product
              </Link>
            </Button>
          </>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Inventory</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-medium underline"
                  data-testid={`products-row-${product.id}`}
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell>{CATEGORY_META[product.category].label}</TableCell>
              <TableCell>
                <ProductStatusBadge status={product.status} />
              </TableCell>
              <TableCell className="text-right">{product.inventory}</TableCell>
              <TableCell className="text-right">{formatMoney(product.price)}</TableCell>
            </TableRow>
          ))}
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No products match this filter.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </>
  );
}

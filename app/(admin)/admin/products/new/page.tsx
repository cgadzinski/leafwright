import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireMerchant } from "@/lib/auth/merchant";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireMerchant("/admin/products/new");
  return (
    <>
      <PageHeader
        title="New product"
        description="Save a draft to keep working, or publish it to the storefront."
      />
      <ProductForm />
    </>
  );
}

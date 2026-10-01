import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { requireMerchant } from "@/lib/auth/merchant";
import { db } from "@/lib/db";
import { PromoForm } from "./promo-form";

export const metadata: Metadata = { title: "Promo" };

export default async function AdminPromoPage({ params }: PageProps<"/admin/promos/[id]">) {
  const { id } = await params;
  const { store } = await requireMerchant(`/admin/promos/${id}`);
  const promo = id === "new" ? undefined : await db.promos.getById(id);
  if (id !== "new" && (!promo || promo.storeId !== store.id)) notFound();

  return (
    <>
      <Link href="/admin/promos" className="text-sm text-muted-foreground hover:underline">
        ← Promos
      </Link>
      <PageHeader
        title={promo ? promo.code : "New promo"}
        description={
          promo
            ? `Used ${promo.usageCount} time${promo.usageCount === 1 ? "" : "s"}.`
            : "Codes are shared across the storefront but only discount your items."
        }
      />
      <PromoForm promo={promo} />
    </>
  );
}

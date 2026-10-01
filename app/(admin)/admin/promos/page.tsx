import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
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
import { describePromo, evaluatePromo } from "@/lib/commerce/promo";
import { db } from "@/lib/db";
import { PromoToggle } from "./promo-toggle";

export const metadata: Metadata = { title: "Promos" };

export default async function AdminPromosPage({ searchParams }: PageProps<"/admin/promos">) {
  const { store } = await requireMerchant("/admin/promos");
  const { saved } = await searchParams;
  const promos = await db.promos.list(store.id);

  return (
    <>
      <PageHeader
        title="Promos"
        description="Codes apply to your items only, wherever the shopper enters them."
        actions={
          <Button asChild>
            <Link href="/admin/promos/new" data-testid="promos-new">
              New promo
            </Link>
          </Button>
        }
      />
      {saved ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          Promo saved.
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Offer</TableHead>
            <TableHead>Window</TableHead>
            <TableHead className="text-right">Uses</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promos.map((promo) => {
            const evaluation = evaluatePromo(promo);
            return (
              <TableRow key={promo.id}>
                <TableCell>
                  <Link
                    href={`/admin/promos/${promo.id}`}
                    className="font-medium underline"
                    data-testid={`promos-row-${promo.id}`}
                  >
                    {promo.code}
                  </Link>
                </TableCell>
                <TableCell>{describePromo(promo)}</TableCell>
                <TableCell>
                  {new Date(promo.startsAt).toLocaleDateString("en-US")} –{" "}
                  {new Date(promo.endsAt).toLocaleDateString("en-US")}
                  {!evaluation.ok && promo.isActive ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {evaluation.reason.replace("_", " ")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">{promo.usageCount}</TableCell>
                <TableCell>
                  <PromoToggle id={promo.id} isActive={promo.isActive} code={promo.code} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

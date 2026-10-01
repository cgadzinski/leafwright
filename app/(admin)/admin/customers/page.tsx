import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { summarizeCustomers } from "@/lib/admin/customers";
import { requireMerchant } from "@/lib/auth/merchant";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const { store } = await requireMerchant("/admin/customers");
  const [orders, users] = await Promise.all([
    db.orders.list({ storeId: store.id }),
    db.users.list(),
  ]);
  const customers = summarizeCustomers(orders, users);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} people have ordered from ${store.name}.`}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead>Last order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="font-medium underline"
                  data-testid={`customers-row-${customer.id}`}
                >
                  {customer.name}
                </Link>
                {customer.isGuest ? <span className="text-muted-foreground"> · guest</span> : null}
              </TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell className="text-right">{customer.orderCount}</TableCell>
              <TableCell className="text-right">{formatMoney(customer.totalSpent)}</TableCell>
              <TableCell>{new Date(customer.lastOrderAt).toLocaleDateString("en-US")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

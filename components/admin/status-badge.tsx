import { Badge } from "@/components/ui/badge";
import type { OrderStatus, ProductStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const ORDER: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: "Placed", className: "bg-slate-100 text-slate-800" },
  paid: { label: "Paid", className: "bg-sky-100 text-sky-800" },
  fulfilled: { label: "Fulfilled", className: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Delivered", className: "bg-emerald-200 text-emerald-900" },
  refunded: { label: "Refunded", className: "bg-rose-100 text-rose-800" },
};

const PRODUCT: Record<ProductStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-100 text-amber-800" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-slate-200 text-slate-700" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", ORDER[status].className)}
      data-status={status}
    >
      {ORDER[status].label}
    </Badge>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", PRODUCT[status].className)}
      data-status={status}
    >
      {PRODUCT[status].label}
    </Badge>
  );
}

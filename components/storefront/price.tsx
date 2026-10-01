import { formatMoney } from "@/lib/commerce/cart";
import { cn } from "@/lib/utils";

export function Price({
  cents,
  compareAt,
  className,
}: {
  cents: number;
  compareAt?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-medium">{formatMoney(cents)}</span>
      {compareAt && compareAt > cents ? (
        <span className="text-sm text-muted-foreground line-through">{formatMoney(compareAt)}</span>
      ) : null}
    </span>
  );
}

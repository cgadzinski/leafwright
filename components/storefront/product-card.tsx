import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CATEGORY_META } from "@/lib/catalog";
import type { Product } from "@/lib/db/schema";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  storeName,
  testIdPrefix,
  quickAddAction,
}: {
  product: Product;
  storeName?: string;
  /** `home-featured` or `catalog-card`; the slug is appended. */
  testIdPrefix: string;
  quickAddAction?: (formData: FormData) => void | Promise<void>;
}) {
  const meta = CATEGORY_META[product.category];
  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col gap-3"
        data-testid={`${testIdPrefix}-${product.slug}`}
      >
        <ProductImage src={product.images[0] ?? meta.image} alt={product.name} />
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{meta.label}</p>
          <h3 className="font-medium group-hover:underline">{product.name}</h3>
          {storeName ? <p className="text-sm text-muted-foreground">{storeName}</p> : null}
          <Price cents={product.price} compareAt={product.compareAtPrice} className="mt-1" />
        </div>
      </Link>
      {quickAddAction ? (
        <form action={quickAddAction}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="quantity" value="1" />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full"
            data-testid={`catalog-quick-add-${product.slug}`}
          >
            Quick add
          </Button>
        </form>
      ) : null}
    </article>
  );
}

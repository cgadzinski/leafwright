"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LIST, SORT_OPTIONS, type SortValue } from "@/lib/catalog";
import { CategorySchema, type Category, type Product, type Store } from "@/lib/db/schema";
import { pendo } from "@/lib/pendo";

const ALL = "all";

/** The last search reported. Module scope, so coming back to the same results doesn't repeat it. */
let reportedSearch = "";

function isSort(value: string | null): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function readCategory(params: Pick<URLSearchParams, "get">): Category | undefined {
  const parsed = CategorySchema.safeParse(params.get("category"));
  return parsed.success ? parsed.data : undefined;
}

function readSort(params: Pick<URLSearchParams, "get">): SortValue {
  const value = params.get("sort");
  return isSort(value) ? value : "featured";
}

function matches(product: Product, category: Category | undefined, query: string): boolean {
  return (
    (!category || product.category === category) &&
    (!query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.includes(query))
  );
}

export function CatalogView({
  products,
  stores,
  quickAddAction,
}: {
  products: Product[];
  stores: Store[];
  quickAddAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = readCategory(params);
  const sort = readSort(params);
  const query = params.get("q")?.trim().toLowerCase() ?? "";

  const storeName = useMemo(() => new Map(stores.map((store) => [store.id, store.name])), [stores]);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => matches(product, category, query));
    switch (sort) {
      case "newest":
        return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "price-asc":
        return filtered.sort((a, b) => a.price - b.price);
      case "price-desc":
        return filtered.sort((a, b) => b.price - a.price);
      default:
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [products, category, query, sort]);

  // A search from the header lands here; report it once, with how many products it found.
  useEffect(() => {
    if (!query) {
      reportedSearch = "";
      return;
    }
    if (query === reportedSearch) return;
    reportedSearch = query;
    pendo.track("Products Searched", {
      query: query.slice(0, 100),
      resultsCount: visible.length,
      hasResults: visible.length > 0,
      activeCategory: category ?? ALL,
      sort,
    });
  }, [query, visible.length, category, sort]);

  function update(key: "category" | "sort", value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });

    if (search === params.toString()) return;
    const nextCategory = readCategory(next);
    pendo.track("Catalog Filtered", {
      filterType: key,
      category: nextCategory ?? ALL,
      sort: readSort(next),
      query: query ? query.slice(0, 100) : undefined,
      resultsCount: products.filter((product) => matches(product, nextCategory, query)).length,
      totalProducts: products.length,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {query
              ? `Results for “${params.get("q")}”`
              : category
                ? CATEGORY_LIST.find((c) => c.slug === category)?.label
                : "Shop everything"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{visible.length} products</p>
        </div>
        <div className="flex gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="catalog-category">Category</Label>
            <Select value={category ?? ALL} onValueChange={(value) => update("category", value)}>
              <SelectTrigger id="catalog-category" className="w-44" data-testid="catalog-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {CATEGORY_LIST.map((item) => (
                  <SelectItem key={item.slug} value={item.slug}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="catalog-sort">Sort</Label>
            <Select value={sort} onValueChange={(value) => update("sort", value)}>
              <SelectTrigger id="catalog-sort" className="w-44" data-testid="catalog-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Nothing matches yet. Try another category or a broader search.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeName={storeName.get(product.storeId)}
              testIdPrefix="catalog-card"
              quickAddAction={quickAddAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

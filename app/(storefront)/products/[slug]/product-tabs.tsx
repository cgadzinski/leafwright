"use client";

import { useState } from "react";
import { CARE_LABELS } from "@/lib/catalog";
import { FREE_STANDARD_SHIPPING_THRESHOLD, formatMoney, SHIPPING_RATES } from "@/lib/commerce/cart";
import type { Product, Store } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "description", label: "Description" },
  { id: "care", label: "Care" },
  { id: "shipping", label: "Shipping" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductTabs({ product, store }: { product: Product; store: Store }) {
  const [active, setActive] = useState<TabId>("description");
  const isPlant = product.category !== "planters" && product.category !== "tools";

  return (
    <section className="mt-8">
      <div role="tablist" aria-label="Product details" className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`pdp-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`pdp-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              active === tab.id
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:border-border",
            )}
            data-testid={`pdp-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`pdp-panel-${active}`}
        aria-labelledby={`pdp-tab-${active}`}
        className="mt-4 space-y-2 text-sm text-muted-foreground"
      >
        {active === "description" ? <p>{product.description}</p> : null}
        {active === "care" ? (
          isPlant ? (
            <ul className="grid gap-1">
              <li>{CARE_LABELS.light[product.care.light]}</li>
              <li>{CARE_LABELS.water[product.care.water]}</li>
              <li>{product.care.petSafe ? "Pet-safe" : "Keep away from pets"}</li>
              <li>{CARE_LABELS.difficulty[product.care.difficulty]}</li>
            </ul>
          ) : (
            <p>No plant care needed. Wipe clean with a damp cloth.</p>
          )
        ) : null}
        {active === "shipping" ? (
          <>
            <p>
              Ships from {store.name} in {store.region} within two business days.
            </p>
            <p>
              Standard shipping {formatMoney(SHIPPING_RATES.standard)}, free on orders over{" "}
              {formatMoney(FREE_STANDARD_SHIPPING_THRESHOLD)} from one nursery. Express{" "}
              {formatMoney(SHIPPING_RATES.express)}.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { pendo } from "@/lib/pendo";
import { applyPromoCode, type CartActionState } from "../../cart/actions";

/**
 * How the shopper got here: "internal" after navigating inside the app (the home banner),
 * otherwise "external" or "direct" for a page load from a link elsewhere or a typed URL.
 */
function entryPoint(): "internal" | "external" | "direct" {
  const [navigation] = performance.getEntriesByType("navigation");
  if (navigation && new URL(navigation.name).pathname !== window.location.pathname) {
    return "internal";
  }
  if (!document.referrer) return "direct";
  return new URL(document.referrer).origin === window.location.origin ? "internal" : "external";
}

export function PromoLanding({ code }: { code: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [result, setResult] = useState<CartActionState | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const visit = { code: code.slice(0, 32), source: "link", entryPoint: entryPoint() };
    applyPromoCode(code).then((state) => {
      setResult(state);
      if (state.ok) {
        analytics.track("Promo Applied", { code, source: "link" });
        pendo.track("Promo Applied", { ...visit, ...state.promo });
        router.replace("/products");
      } else if (state.reason) {
        pendo.track("Promo Code Rejected", { ...visit, reason: state.reason });
      }
    });
  }, [code, router]);

  if (result?.error) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">{code}</h1>
        <p className="mt-2 text-destructive" role="alert">
          {result.error}
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Keep shopping</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Applying {code}…</h1>
      <p className="mt-2 text-muted-foreground" role="status">
        {result?.message ?? "One moment while we add the code to your cart."}
      </p>
    </>
  );
}

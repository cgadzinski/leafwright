"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analytics } from "@/lib/analytics";

export function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      className="flex w-full max-w-sm items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (trimmed) analytics.track("Products Searched", { query: trimmed });
        router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
      }}
    >
      <Input
        type="search"
        name="q"
        placeholder="Search plants, pots, tools"
        aria-label="Search products"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        data-testid="nav-search-input"
      />
      <Button
        type="submit"
        variant="secondary"
        size="icon"
        aria-label="Search"
        data-testid="nav-search-submit"
      >
        <Search />
      </Button>
    </form>
  );
}

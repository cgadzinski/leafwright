"use client";

import { CalendarRange } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateRangeFilter({
  testId,
  paramPrefix = "",
}: {
  testId: string;
  paramPrefix?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromKey = `${paramPrefix}from`;
  const toKey = `${paramPrefix}to`;
  const [open, setOpen] = useState(false);
  const from = params.get(fromKey) ?? "";
  const to = params.get(toKey) ?? "";

  function apply(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    for (const [key, name] of [
      [fromKey, "from"],
      [toKey, "to"],
    ] as const) {
      const value = formData.get(name);
      if (typeof value === "string" && value) next.set(key, value);
      else next.delete(key);
    }
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
    setOpen(false);
  }

  const label = from || to ? `${from || "…"} → ${to || "…"}` : "Any date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" data-testid={testId}>
          <CalendarRange /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form action={apply} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${testId}-from`}>From</Label>
            <Input
              id={`${testId}-from`}
              name="from"
              type="date"
              defaultValue={from}
              data-testid={`${testId}-from`}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${testId}-to`}>To</Label>
            <Input
              id={`${testId}-to`}
              name="to"
              type="date"
              defaultValue={to}
              data-testid={`${testId}-to`}
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => apply(new FormData())}
              data-testid={`${testId}-clear`}
            >
              Clear
            </Button>
            <Button type="submit" size="sm" data-testid={`${testId}-apply`}>
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANALYTICS_RANGES } from "@/lib/admin/ranges";

export function RangeSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const search = new URLSearchParams(params.toString());
        search.set("range", next);
        router.replace(`${pathname}?${search.toString()}`);
      }}
    >
      <SelectTrigger className="w-44" aria-label="Date range" data-testid="analytics-date-range">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ANALYTICS_RANGES.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

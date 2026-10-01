"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusFilter({
  options,
  testId,
  paramName = "status",
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  testId: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramName) ?? "all";

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        const next = new URLSearchParams(params.toString());
        if (value === "all") next.delete(paramName);
        else next.set(paramName, value);
        const search = next.toString();
        router.replace(search ? `${pathname}?${search}` : pathname);
      }}
    >
      <SelectTrigger className="w-44" aria-label="Filter by status" data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

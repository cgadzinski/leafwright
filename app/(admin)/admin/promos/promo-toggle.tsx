"use client";

import { useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { togglePromo } from "./actions";

export function PromoToggle({
  id,
  isActive,
  code,
}: {
  id: string;
  isActive: boolean;
  code: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={togglePromo}>
      <input type="hidden" name="id" value={id} />
      <Switch
        checked={isActive}
        onCheckedChange={() => formRef.current?.requestSubmit()}
        aria-label={`${isActive ? "Deactivate" : "Activate"} ${code}`}
        data-testid={`promos-toggle-${id}`}
      />
    </form>
  );
}

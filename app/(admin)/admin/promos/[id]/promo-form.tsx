"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Promo, PromoType } from "@/lib/db/schema";
import { savePromo, type PromoFormState } from "../actions";

const TYPES: Array<{ value: PromoType; label: string }> = [
  { value: "percent", label: "Percent off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "free_shipping", label: "Free shipping" },
];

export function PromoForm({ promo }: { promo?: Promo }) {
  const [state, action, pending] = useActionState<PromoFormState, FormData>(savePromo, {});
  const [type, setType] = useState<PromoType>(promo?.type ?? "percent");
  const errors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-xl space-y-5" noValidate>
      {promo ? <input type="hidden" name="id" value={promo.id} /> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="promo-code">Code</Label>
        <Input
          id="promo-code"
          name="code"
          className="uppercase"
          defaultValue={promo?.code ?? ""}
          data-testid="promo-code"
        />
        {errors.code ? <p className="text-xs text-destructive">{errors.code}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="promo-type">Type</Label>
          <Select name="type" value={type} onValueChange={(value) => setType(value as PromoType)}>
            <SelectTrigger id="promo-type" data-testid="promo-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="promo-value">
            {type === "percent" ? "Percent off" : type === "fixed" ? "Amount off (USD)" : "Value"}
          </Label>
          <Input
            id="promo-value"
            name="value"
            inputMode="decimal"
            disabled={type === "free_shipping"}
            defaultValue={
              promo
                ? promo.type === "fixed"
                  ? (promo.value / 100).toFixed(2)
                  : String(promo.value)
                : ""
            }
            data-testid="promo-value"
          />
          {errors.value ? <p className="text-xs text-destructive">{errors.value}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="promo-starts-at">Starts</Label>
          <Input
            id="promo-starts-at"
            name="startsAt"
            type="date"
            defaultValue={promo?.startsAt.slice(0, 10) ?? today}
            data-testid="promo-starts-at"
          />
          {errors.startsAt ? <p className="text-xs text-destructive">{errors.startsAt}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="promo-ends-at">Ends</Label>
          <Input
            id="promo-ends-at"
            name="endsAt"
            type="date"
            defaultValue={promo?.endsAt.slice(0, 10) ?? ""}
            data-testid="promo-ends-at"
          />
          {errors.endsAt ? <p className="text-xs text-destructive">{errors.endsAt}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="promo-active"
          name="isActive"
          defaultChecked={promo?.isActive ?? true}
          data-testid="promo-active"
        />
        <Label htmlFor="promo-active">Active</Label>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} data-testid="promo-save">
        {pending ? "Saving…" : "Save promo"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAddress, type AccountState } from "./actions";

const FIELDS = [
  { name: "label", label: "Label", autoComplete: "off", placeholder: "Home" },
  { name: "address1", label: "Address", autoComplete: "street-address" },
  { name: "address2", label: "Apartment, suite, etc. (optional)", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "region", label: "State", autoComplete: "address-level1" },
  { name: "postal", label: "Postal code", autoComplete: "postal-code" },
] as const;

export function AddressForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(addAddress, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form
      action={action}
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      key={state.ok ? "reset" : "form"}
    >
      {FIELDS.map((field) => (
        <div key={field.name} className="grid gap-1.5">
          <Label htmlFor={`account-address-${field.name}`}>{field.label}</Label>
          <Input
            id={`account-address-${field.name}`}
            name={field.name}
            autoComplete={field.autoComplete}
            placeholder={"placeholder" in field ? field.placeholder : undefined}
            data-testid={`account-address-${field.name}`}
          />
          {errors[field.name] ? (
            <p className="text-xs text-destructive">{errors[field.name]}</p>
          ) : null}
        </div>
      ))}
      <div className="sm:col-span-2">
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="text-sm text-emerald-700">
            {state.message}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="outline"
          className="mt-2"
          disabled={pending}
          data-testid="account-address-add"
        >
          {pending ? "Adding…" : "Add address"}
        </Button>
      </div>
    </form>
  );
}

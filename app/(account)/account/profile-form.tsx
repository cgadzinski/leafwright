"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfile, type AccountState } from "./actions";

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveProfile, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" type="email" value={email} readOnly data-testid="account-email" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="account-name">Name</Label>
        <Input
          id="account-name"
          name="name"
          autoComplete="name"
          defaultValue={name}
          data-testid="account-name"
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="account-phone">Phone</Label>
        <Input
          id="account-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone}
          data-testid="account-phone"
        />
      </div>
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
      <Button type="submit" disabled={pending} data-testid="account-save">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

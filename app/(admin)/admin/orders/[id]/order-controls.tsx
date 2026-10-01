"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus } from "@/lib/db/schema";
import { addOrderNote, fulfillOrder, refundOrder, type OrderAdminState } from "./actions";

function Feedback({ state }: { state: OrderAdminState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="text-sm text-emerald-700">
        {state.message}
      </p>
    );
  return null;
}

export function FulfillmentControls({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
}) {
  const [fulfillState, fulfillAction, fulfilling] = useActionState<OrderAdminState, FormData>(
    fulfillOrder,
    {},
  );
  const [refundState, refundAction, refunding] = useActionState<OrderAdminState, FormData>(
    refundOrder,
    {},
  );
  const canFulfill = status === "placed" || status === "paid";

  return (
    <div className="space-y-6">
      <form action={fulfillAction} className="space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <div className="grid gap-1.5">
          <Label htmlFor="order-tracking">Tracking number</Label>
          <Input
            id="order-tracking"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            placeholder="1Z…"
            disabled={!canFulfill}
            data-testid="order-tracking"
          />
        </div>
        <Button type="submit" disabled={!canFulfill || fulfilling} data-testid="order-fulfill">
          {fulfilling ? "Updating…" : canFulfill ? "Mark fulfilled" : "Fulfilled"}
        </Button>
        <Feedback state={fulfillState} />
      </form>
      <form action={refundAction} className="space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <Button
          type="submit"
          variant="destructive"
          disabled={status === "refunded" || refunding}
          data-testid="order-refund"
        >
          {refunding ? "Refunding…" : status === "refunded" ? "Refunded" : "Refund order"}
        </Button>
        <Feedback state={refundState} />
      </form>
    </div>
  );
}

export function NoteForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<OrderAdminState, FormData>(addOrderNote, {});
  return (
    <form action={action} className="space-y-3" key={state.message}>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-1.5">
        <Label htmlFor="order-note">Add a note</Label>
        <Textarea id="order-note" name="body" rows={3} data-testid="order-note" />
      </div>
      <Button type="submit" variant="outline" disabled={pending} data-testid="order-note-submit">
        {pending ? "Saving…" : "Add note"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

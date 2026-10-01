"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reorder, requestRefund, type OrderActionState } from "./actions";

export function ReorderButton({ orderNumber }: { orderNumber: string }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(reorder, {});
  return (
    <form action={action}>
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Button type="submit" disabled={pending} data-testid="order-reorder">
        {pending ? "Adding to cart…" : "Reorder"}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function RefundRequestForm({
  orderNumber,
  disabledReason,
}: {
  orderNumber: string;
  disabledReason?: string;
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(requestRefund, {});
  if (disabledReason || state.ok) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {state.message ?? disabledReason}
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <div className="grid gap-1.5">
        <Label htmlFor="refund-reason">What went wrong?</Label>
        <Textarea id="refund-reason" name="reason" rows={3} data-testid="order-refund-reason" />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending} data-testid="order-refund-request">
        {pending ? "Sending…" : "Request refund"}
      </Button>
    </form>
  );
}

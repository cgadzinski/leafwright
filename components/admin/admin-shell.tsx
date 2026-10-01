import { Leaf } from "lucide-react";
import Link from "next/link";
import { AssistantToggle } from "@/components/assistant/assistant-toggle";
import { UserMenu } from "@/components/storefront/user-menu";
import { Badge } from "@/components/ui/badge";
import type { Session } from "next-auth";
import type { Store } from "@/lib/db/schema";
import { daysUntil } from "@/lib/dates";
import { AdminNav } from "./admin-nav";

const PLAN_LABELS: Record<Store["plan"], string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

export function AdminShell({
  store,
  user,
  children,
}: {
  store: Store;
  user: Session["user"];
  children: React.ReactNode;
}) {
  const trialDays = store.trialEndsAt ? daysUntil(store.trialEndsAt) : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold" data-testid="nav-logo">
            <Leaf className="text-emerald-700" /> Leafwright
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{store.name}</span>
          <Badge variant="secondary">{PLAN_LABELS[store.plan]}</Badge>
          {trialDays !== null ? (
            <Link href="/admin/settings/billing" className="text-xs text-amber-700 underline">
              {trialDays} day{trialDays === 1 ? "" : "s"} left in trial
            </Link>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <Link href="/products" className="mr-2 text-sm text-muted-foreground hover:underline">
              View storefront
            </Link>
            <AssistantToggle />
            <UserMenu name={user.name} email={user.email} isMerchant />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

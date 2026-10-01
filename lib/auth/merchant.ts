import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Store } from "@/lib/db/schema";
import { isMerchant } from "./callbacks";

export interface MerchantContext {
  session: Session;
  user: Session["user"];
  store: Store;
}

/** Resolves the signed-in merchant and their store, or redirects. */
export async function requireMerchant(callbackUrl = "/admin"): Promise<MerchantContext> {
  const session = await auth();
  if (!session?.user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (!isMerchant(session.user.role) || !session.store) redirect("/");
  const store = await db.stores.getById(session.store.id);
  if (!store) redirect("/");
  return { session, user: session.user, store };
}

/** Same as `requireMerchant` but returns null instead of redirecting (for actions and handlers). */
export async function currentMerchant(): Promise<MerchantContext | null> {
  const session = await auth();
  if (!session?.user || !isMerchant(session.user.role) || !session.store) return null;
  const store = await db.stores.getById(session.store.id);
  if (!store) return null;
  return { session, user: session.user, store };
}

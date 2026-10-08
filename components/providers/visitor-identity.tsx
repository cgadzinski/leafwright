import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { IdentifyOptions } from "@/types/global";
import { IdentifyVisitor } from "./identify-visitor";

/**
 * Identifies the signed-in user from the session, with the user and store records for the
 * fields the session does not carry. Merchants carry their store as the account; shoppers have
 * no account. Renders nothing for guests.
 */
export async function VisitorIdentity() {
  const session = await auth();
  if (!session?.user) return null;

  // These records only add optional fields, so a failed lookup must not break the page.
  const [user, store] = await Promise.all([
    db.users.getById(session.user.id).catch(() => undefined),
    session.store ? db.stores.getById(session.store.id).catch(() => undefined) : undefined,
  ]);

  const visitor: IdentifyOptions["visitor"] = {
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.name,
    role: session.user.role,
    storeId: session.store?.id,
    followedStoreIds: user?.followedStoreIds,
    createdAt: user?.createdAt,
    lastSignInAt: user?.lastSignInAt,
  };

  const identity: IdentifyOptions = session.store
    ? {
        visitor,
        account: {
          id: session.store.id,
          name: session.store.name,
          slug: session.store.slug,
          plan: session.store.plan,
          trialEndsAt: session.store.trialEndsAt,
          region: store?.region,
          createdAt: store?.createdAt,
        },
      }
    : { visitor };

  return <IdentifyVisitor identity={identity} />;
}

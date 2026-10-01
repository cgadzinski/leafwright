import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { SessionStore } from "@/types/next-auth";
import { db } from "@/lib/db";
import type { Store } from "@/lib/db/schema";

export interface JwtCallbackInput {
  token: JWT;
  user?: User | null;
}

export interface JwtCallbackDeps {
  stampSignIn: (userId: string, at: string) => Promise<unknown>;
  now?: () => Date;
}

/**
 * On the first call after sign-in `user` is present: copy the identity fields onto the
 * token and record the sign-in time. Later calls only refresh the token.
 */
export async function jwtCallback(
  { token, user }: JwtCallbackInput,
  deps: JwtCallbackDeps = { stampSignIn: (id, at) => db.users.update(id, { lastSignInAt: at }) },
): Promise<JWT> {
  if (user?.id) {
    const at = (deps.now ?? (() => new Date()))().toISOString();
    await deps.stampSignIn(user.id, at);
    return {
      ...token,
      id: user.id,
      role: user.role,
      storeId: user.storeId,
      email: user.email ?? token.email,
      name: user.name ?? token.name,
    };
  }
  return token;
}

export interface SessionCallbackInput {
  session: Session;
  token: JWT;
}

export interface SessionCallbackDeps {
  loadStore: (storeId: string) => Promise<Store | undefined>;
}

export function toSessionStore(store: Store): SessionStore {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    plan: store.plan,
    trialEndsAt: store.trialEndsAt ?? null,
  };
}

/** Exposes `session.user` and `session.store` (or `null`) from the token. */
export async function sessionCallback(
  { session, token }: SessionCallbackInput,
  deps: SessionCallbackDeps = { loadStore: (id) => db.stores.getById(id) },
): Promise<Session> {
  const store = token.storeId ? await deps.loadStore(token.storeId) : undefined;
  return {
    ...session,
    user: {
      ...session.user,
      id: token.id,
      email: token.email ?? session.user?.email ?? "",
      name: token.name ?? session.user?.name ?? "",
      role: token.role,
    },
    store: store ? toSessionStore(store) : null,
  };
}

export function isMerchant(role: string | undefined): boolean {
  return role === "owner" || role === "staff";
}

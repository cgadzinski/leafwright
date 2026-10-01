import type { DefaultSession } from "next-auth";
import type { Plan, Role } from "@/lib/db/schema";

export interface SessionStore {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  trialEndsAt: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    } & DefaultSession["user"];
    /** The merchant's store, or `null` for shoppers. */
    store: SessionStore | null;
  }

  interface User {
    role: Role;
    storeId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    storeId?: string;
  }
}

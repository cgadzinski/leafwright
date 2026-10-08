"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { authenticate, CredentialsSchema } from "@/lib/auth/credentials";
import { mergeAnonymousCart } from "@/lib/cart/server";
import { db } from "@/lib/db";
import { SYSTEM_ID, trackServerEvent } from "@/lib/pendo.server";

export interface SignInState {
  error?: string;
  values?: { email: string };
}

const SignInInputSchema = CredentialsSchema.extend({
  callbackUrl: z.string().optional(),
});

/** What sent the visitor to sign in, read from where they will land afterwards. */
function entryPoint(destination: string): string {
  if (destination === "/checkout") return "checkout";
  if (destination.startsWith("/admin")) return "admin";
  if (destination.startsWith("/account")) return "account";
  if (destination.startsWith("/stores/")) return "store_follow";
  return destination === "/" ? "header" : "other";
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = SignInInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  const callbackUrl = formData.get("callbackUrl");
  const destination = safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined);
  // Never the email address or password: only why it failed and what prompted the sign-in.
  const prompt = {
    entryPoint: entryPoint(destination),
    callbackUrl: destination.split("?")[0].slice(0, 100),
  };

  if (!parsed.success) {
    trackServerEvent(
      "Sign In Failed",
      { visitorId: SYSTEM_ID },
      { reason: "invalid_input", ...prompt },
    );
    return { error: parsed.error.issues[0]?.message ?? "Check your details.", values: { email } };
  }

  const user = await authenticate(parsed.data);
  if (!user) {
    trackServerEvent(
      "Sign In Failed",
      { visitorId: SYSTEM_ID },
      { reason: "invalid_credentials", ...prompt },
    );
    return { error: "That email and password don't match.", values: { email } };
  }
  const mergedCartLines = await mergeAnonymousCart(user.id);
  const store = user.storeId ? await db.stores.getById(user.storeId) : undefined;
  trackServerEvent(
    "Signed In",
    { visitorId: user.id, accountId: user.storeId },
    { role: user.role, ...prompt, mergedCartLines, storeId: store?.id, storePlan: store?.plan },
  );

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(parsed.data.callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      trackServerEvent(
        "Sign In Failed",
        { visitorId: SYSTEM_ID },
        { reason: "auth_error", ...prompt },
      );
      return { error: "That email and password don't match.", values: { email } };
    }
    throw error;
  }
  return {};
}

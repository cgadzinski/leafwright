import { z } from "zod";
import { db } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { verifyPassword } from "./password";

export const CredentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type Credentials = z.infer<typeof CredentialsSchema>;

/**
 * Checks a password against the user's stored hash. The shared demo password from the
 * environment is also accepted for every account so the deploy can rotate it without
 * reseeding.
 */
export function passwordMatches(user: User, password: string): boolean {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (demoPassword && password === demoPassword) return true;
  return verifyPassword(password, user.passwordHash);
}

export async function authenticate(input: unknown): Promise<User | null> {
  const parsed = CredentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const user = await db.users.getByEmail(parsed.data.email);
  if (!user || !passwordMatches(user, parsed.data.password)) return null;
  return user;
}

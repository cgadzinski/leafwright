import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { callbackUrl } = await searchParams;
  const destination = safeCallbackUrl(Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl);
  const session = await auth();
  if (session?.user) redirect(destination);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to Leafwright</CardTitle>
          <CardDescription>
            Shoppers and nursery staff use the same sign-in. New here? Browse and check out as a
            guest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm callbackUrl={destination} />
        </CardContent>
      </Card>
    </main>
  );
}

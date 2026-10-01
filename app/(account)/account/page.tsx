import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { makeDefaultAddress, removeAddress } from "./actions";
import { AddressForm } from "./address-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your profile" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Faccount");
  const user = await db.users.getById(session.user.id);
  if (!user) redirect("/sign-in");
  const addresses = (await db.addresses.listByUser(user.id)).sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.label.localeCompare(b.label),
  );

  return (
    <main className="mt-6 grid gap-12 lg:grid-cols-2">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Member since{" "}
          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          .
        </p>
        <div className="mt-6">
          <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} />
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No addresses yet. Add one below or save one at checkout.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {addresses.map((address) => (
              <li key={address.id} className="flex items-start justify-between gap-4 p-4 text-sm">
                <div>
                  <p className="font-medium">
                    {address.label}{" "}
                    {address.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                  </p>
                  <p className="text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}, {address.region} {address.postalCode}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!address.isDefault ? (
                    <form action={makeDefaultAddress}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        data-testid={`account-address-default-${address.id}`}
                      >
                        Make default
                      </Button>
                    </form>
                  ) : null}
                  <form action={removeAddress}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      data-testid={`account-address-remove-${address.id}`}
                    >
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-8 font-medium">Add an address</h3>
        <div className="mt-3">
          <AddressForm />
        </div>
      </section>
    </main>
  );
}

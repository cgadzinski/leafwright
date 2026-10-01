import { Leaf, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AssistantToggle } from "@/components/assistant/assistant-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isMerchant } from "@/lib/auth/callbacks";
import { cartItemCount, getCart } from "@/lib/cart/server";
import { SearchForm } from "./search-form";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const [session, cart] = await Promise.all([auth(), getCart()]);
  const count = cartItemCount(cart);
  const merchant = isMerchant(session?.user?.role);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold" data-testid="nav-logo">
          <Leaf className="text-emerald-700" />
          Leafwright
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button asChild variant="ghost">
            <Link href="/products" data-testid="nav-shop">
              Shop
            </Link>
          </Button>
          {merchant ? (
            <Button asChild variant="ghost">
              <Link href="/admin" data-testid="nav-admin">
                Admin
              </Link>
            </Button>
          ) : null}
        </nav>
        <div className="hidden flex-1 justify-center md:flex">
          <Suspense>
            <SearchForm />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <AssistantToggle />
          <Button asChild variant="ghost" size="icon" aria-label={`Cart, ${count} items`}>
            <Link href="/cart" data-testid="nav-cart" className="relative">
              <ShoppingBag />
              {count > 0 ? (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]">
                  {count}
                </Badge>
              ) : null}
            </Link>
          </Button>
          {session?.user ? (
            <UserMenu name={session.user.name} email={session.user.email} isMerchant={merchant} />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in" data-testid="nav-sign-in">
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Suspense>
          <SearchForm />
        </Suspense>
      </div>
    </header>
  );
}

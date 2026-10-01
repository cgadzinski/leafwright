import Link from "next/link";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontChrome>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/account" className="hover:underline">
            Profile
          </Link>
          <Link href="/account/orders" className="hover:underline">
            Orders
          </Link>
        </nav>
        {children}
      </div>
    </StorefrontChrome>
  );
}

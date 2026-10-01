import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <p>Leafwright · independent nurseries, one checkout.</p>
        <nav className="flex gap-4">
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <Link href="/help" className="hover:underline">
            Help
          </Link>
          <Link href="/sign-in" className="hover:underline">
            Nursery sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

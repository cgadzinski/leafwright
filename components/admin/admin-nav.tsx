"use client";

import { useBooleanFlagValue } from "@openfeature/react-sdk";
import { BarChart3, LayoutDashboard, Package, Receipt, Settings, Tag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FLAGS } from "@/lib/flags.config";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/promos", label: "Promos", icon: Tag },
  { href: "/admin/settings/store", label: "Settings", icon: Settings, match: "/admin/settings" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const analyticsEnabled = useBooleanFlagValue(FLAGS.MERCHANT_ANALYTICS, false);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
      active
        ? "bg-accent text-accent-foreground font-medium"
        : "text-muted-foreground hover:bg-accent/60",
    );

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {ITEMS.map((item) => {
        const base = "match" in item ? item.match : item.href;
        const active =
          "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(base);
        return (
          <Link key={item.href} href={item.href} className={linkClass(active)}>
            <item.icon className="size-4" /> {item.label}
          </Link>
        );
      })}
      {analyticsEnabled ? (
        <Link
          href="/admin/analytics"
          className={linkClass(pathname.startsWith("/admin/analytics"))}
          data-testid="nav-admin-analytics"
        >
          <BarChart3 className="size-4" /> Analytics
        </Link>
      ) : null}
    </nav>
  );
}

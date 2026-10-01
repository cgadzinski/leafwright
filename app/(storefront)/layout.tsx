import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}

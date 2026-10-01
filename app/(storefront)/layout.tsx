import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssistantProvider>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </AssistantProvider>
  );
}

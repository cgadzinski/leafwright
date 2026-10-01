import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Header, footer, and assistant context shared by the storefront and account areas. */
export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <AssistantProvider>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
      <ChatPanel persona="shopper" />
    </AssistantProvider>
  );
}

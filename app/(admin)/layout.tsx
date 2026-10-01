import { AdminShell } from "@/components/admin/admin-shell";
import { FlagsProvider } from "@/components/admin/flags-provider";
import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { ChatPanel } from "@/components/chat/chat-panel";
import { requireMerchant } from "@/lib/auth/merchant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { store, user } = await requireMerchant();
  return (
    <FlagsProvider plan={store.plan}>
      <AssistantProvider>
        <AdminShell store={store} user={user}>
          {children}
        </AdminShell>
        <ChatPanel persona="merchant" />
      </AssistantProvider>
    </FlagsProvider>
  );
}

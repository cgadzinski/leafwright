import type { Metadata } from "next";
import { OpenAssistantOnMount } from "@/components/assistant/open-on-mount";

export const metadata: Metadata = { title: "Help" };

const FAQ = [
  {
    q: "How are plants shipped?",
    a: "Each nursery packs and ships its own items, so an order with plants from two nurseries arrives as two parcels. Plants are wrapped in kraft paper with a heat pack when the forecast calls for it.",
  },
  {
    q: "What if my plant arrives damaged?",
    a: "Open your order from your account and request a refund within seven days. Attach a photo and the nursery will replace or refund it.",
  },
  {
    q: "Can I check out without an account?",
    a: "Yes. Enter an email at checkout and we'll send the receipt there. Sign in later with the same email to see the order in your history.",
  },
  {
    q: "How do promo codes work?",
    a: "Codes are issued by a nursery and apply to that nursery's items in your cart. Enter one on the cart page or follow a promo link.",
  },
  {
    q: "Do you ship outside the US?",
    a: "Not yet. All four nurseries ship within the continental US only.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <OpenAssistantOnMount />
      <h1 className="text-3xl font-semibold tracking-tight">Help</h1>
      <p className="mt-2 text-muted-foreground">
        Common questions below. For picking a plant, ask the assistant; it knows the catalog of
        every nursery.
      </p>
      <dl className="mt-8 space-y-6">
        {FAQ.map((item) => (
          <div key={item.q}>
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

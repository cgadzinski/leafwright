import type { Metadata } from "next";
import { PromoLanding } from "./promo-landing";

export const metadata: Metadata = { title: "Applying your code" };

export default async function PromoPage({ params }: PageProps<"/promo/[code]">) {
  const { code } = await params;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <PromoLanding code={decodeURIComponent(code).toUpperCase()} />
    </main>
  );
}

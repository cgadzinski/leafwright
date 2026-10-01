import { timingSafeEqual } from "node:crypto";
import { archiveStaleBotProducts } from "@/lib/jobs/archive-bot-products";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return (
    header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}

/** Nightly: archive products the traffic bot created more than a week ago. */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const archived = await archiveStaleBotProducts();
  return Response.json({ archived: archived.length, ids: archived });
}

export const POST = GET;

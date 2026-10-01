import { cookies } from "next/headers";
import type { RecordSource } from "@/lib/db/schema";

/** Automated sessions identify themselves with this cookie so their records can be cleaned up. */
export const SOURCE_COOKIE = "lw_source";

export async function getRecordSource(): Promise<RecordSource> {
  const jar = await cookies();
  return jar.get(SOURCE_COOKIE)?.value === "bot" ? "bot" : "app";
}

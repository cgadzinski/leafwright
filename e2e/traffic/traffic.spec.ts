import { test } from "@playwright/test";
import { buildConversationPlan, buildPlan, describeSession } from "./plan";
import { runMerchantSession } from "./scenarios/merchant";
import { runShopperSession } from "./scenarios/shopper";
import { closeSession, openSession } from "./session";

const seed = process.env.TRAFFIC_SEED ?? new Date().toISOString().slice(0, 13);
const multiplier = Number(process.env.SESSIONS ?? "1") || 1;
const runNumber =
  Number(process.env.GITHUB_RUN_NUMBER ?? process.env.TRAFFIC_RUN_NUMBER ?? "1") || 1;
const conversationsOnly = process.env.TRAFFIC_MODE === "conversations";
const persona = process.env.CONVERSATION_PERSONA;
const plan = conversationsOnly
  ? buildConversationPlan({
      seed,
      runNumber,
      count: process.env.CONVERSATIONS ? Number(process.env.CONVERSATIONS) || undefined : undefined,
      persona: persona === "shopper" || persona === "merchant" ? persona : "both",
    })
  : buildPlan({ seed, multiplier, runNumber });
const label = conversationsOnly ? "conversations" : "traffic";

test.describe(`${label} run ${seed} ×${multiplier} (#${runNumber})`, () => {
  for (const session of plan) {
    test(describeSession(session), async ({ browser, baseURL }, testInfo) => {
      const run = await openSession(browser, session, baseURL ?? "http://localhost:3000");
      let failed = false;
      try {
        if (session.kind === "shopper") await runShopperSession(run, session);
        else await runMerchantSession(run, session);
      } catch (error) {
        failed = true;
        run.log(`failed: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
        throw error;
      } finally {
        await closeSession(run, testInfo, failed);
      }
    });
  }
});

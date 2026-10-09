import { expect, type Page } from "@playwright/test";
import { CHAT } from "../config";
import { describeConversation, planConversation, type Persona, type Scope } from "../conversations";
import { dwell, typeInto } from "../pacing";
import type { SessionRun } from "../session";

const RATE_UP = '[data-testid^="chat-rate-up-"]';

/** Id of the newest finished assistant reply, read from its rating button. */
async function lastReplyId(page: Page): Promise<string | undefined> {
  const buttons = page.locator(RATE_UP);
  if ((await buttons.count()) === 0) return undefined;
  const testId = await buttons.last().getAttribute("data-testid");
  return testId?.replace("chat-rate-up-", "");
}

/** Waits until a reply newer than `previous` has finished streaming, and returns its id. */
async function waitForReply(page: Page, previous: string | undefined): Promise<string> {
  await expect
    .poll(() => lastReplyId(page), { timeout: CHAT.replyTimeoutMs, intervals: [500, 1000] })
    .not.toBe(previous);
  await expect(page.getByTestId("chat-input")).toBeEnabled({ timeout: CHAT.replyTimeoutMs });
  const id = await lastReplyId(page);
  if (!id) throw new Error("The assistant reply finished without a rating control");
  return id;
}

/** Reading time grows with the reply, the way a person reads before answering. */
async function read(page: Page, run: SessionRun): Promise<void> {
  const text = (await page.locator(`[data-role="assistant"]`).last().innerText()).length;
  const ms = Math.min(CHAT.maxReadMs, text * CHAT.readMsPerChar);
  await page.waitForTimeout(ms);
  await dwell(page, run.rng, 0.3);
}

/**
 * Holds one conversation in an already open panel: sends each planned turn, reads the reply,
 * sometimes rates or retries it. Returns the planned scope so callers can decide what happens next.
 */
export async function converse(run: SessionRun, persona: Persona, intent?: string): Promise<Scope> {
  const { page, rng, log } = run;
  const plan = planConversation(rng, persona, intent);
  log(`conversation: ${describeConversation(plan)}`);

  let previous = await lastReplyId(page);
  for (const [index, turn] of plan.turns.entries()) {
    if (index === 0 && plan.suggestion !== undefined) {
      await page.getByTestId(`chat-suggestion-${plan.suggestion}`).click();
    } else {
      await typeInto(page.getByTestId("chat-input"), rng, turn);
      await dwell(page, rng, 0.2);
      await page.getByTestId("chat-send").click();
    }
    let replyId = await waitForReply(page, previous);
    await read(page, run);

    const isLast = index === plan.turns.length - 1;
    const scope = plan.turnScopes[index];

    if (scope !== "supported" && rng.chance(CHAT.retryShare)) {
      await page.getByTestId(`chat-retry-${replyId}`).click();
      log(`retried turn ${index + 1}`);
      replyId = await waitForReply(page, replyId);
      await read(page, run);
    }

    if (rng.chance(isLast ? CHAT.rateLastShare : CHAT.rateEachShare)) {
      const up = rng.chance(CHAT.thumbsUpShare[scope]);
      await page.getByTestId(`chat-rate-${up ? "up" : "down"}-${replyId}`).click();
      log(`rated turn ${index + 1} ${up ? "up" : "down"}`);
    }
    previous = replyId;
  }
  return plan.scope;
}

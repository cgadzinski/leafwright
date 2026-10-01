import type { Locator, Page } from "@playwright/test";
import { PACING } from "./config";
import type { Rng } from "./rng";

/** Pause like a person reading the page. */
export async function dwell(page: Page, rng: Rng, scale = 1): Promise<void> {
  const ms = rng.int(PACING.dwellMs.min, PACING.dwellMs.max) * scale;
  await page.waitForTimeout(ms);
}

/** Type at human speed instead of pasting. */
export async function typeInto(locator: Locator, rng: Rng, text: string): Promise<void> {
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(text, {
    delay: rng.int(PACING.typingDelayMs.min, PACING.typingDelayMs.max),
  });
}

/** Sometimes go back a page and come forward again, the way people do. */
export async function maybeBacktrack(page: Page, rng: Rng): Promise<void> {
  if (!rng.chance(PACING.backNavigationShare)) return;
  await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => undefined);
  await dwell(page, rng, 0.5);
  await page.goForward({ waitUntil: "domcontentloaded" }).catch(() => undefined);
}

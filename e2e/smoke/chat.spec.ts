import { expect, test } from "@playwright/test";

test("shopper opens the assistant, sends a suggestion, and rates the reply", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("assistant-toggle").click();
  await expect(page.getByTestId("chat-panel")).toBeVisible();

  await page.getByTestId("chat-suggestion-0").click();
  const reply = page.locator('[data-role="assistant"]').last();
  await expect(reply).toContainText("/products/", { timeout: 20_000 });

  const rateUp = page.locator('[data-testid^="chat-rate-up-"]').last();
  await expect(rateUp).toBeVisible();
  const messageId = (await rateUp.getAttribute("data-testid"))!.replace("chat-rate-up-", "");
  expect(messageId).toMatch(/^msg_/);
  await rateUp.click();
  await expect(rateUp).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("chat-input").fill("Pet-safe under $30");
  await page.getByTestId("chat-send").click();
  await expect(page.locator('[data-role="assistant"]')).toHaveCount(2);
  await expect(page.locator('[data-role="assistant"]').last()).toContainText("pet-safe", {
    timeout: 20_000,
  });
});

test("help page opens the assistant by default", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByTestId("chat-panel")).toBeVisible();
});

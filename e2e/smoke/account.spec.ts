import { expect, test } from "@playwright/test";

test("signed-in shopper updates their profile, adds an address, and reorders", async ({ page }) => {
  await page.goto("/sign-in?callbackUrl=%2Faccount");
  await page.getByTestId("signin-email").fill("hayden.welch@example.com");
  await page.getByTestId("signin-password").fill("leafwright-demo");
  await page.getByTestId("signin-submit").click();
  await expect(page).toHaveURL(/\/account$/);

  await page.getByTestId("account-phone").fill("555-0100");
  await page.getByTestId("account-save").click();
  await expect(page.getByRole("status")).toContainText("Profile saved");

  await page.getByTestId("account-address-label").fill("Studio");
  await page.getByTestId("account-address-address1").fill("9 Kiln Road");
  await page.getByTestId("account-address-city").fill("Asheville");
  await page.getByTestId("account-address-region").fill("NC");
  await page.getByTestId("account-address-postal").fill("28801");
  await page.getByTestId("account-address-add").click();
  await expect(page.getByText("9 Kiln Road")).toBeVisible();

  await page.goto("/account/orders");
  const firstOrder = page.locator('[data-testid^="account-order-"]').first();
  const orderNumber = await firstOrder.textContent();
  await firstOrder.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(orderNumber!.trim());

  await page.getByTestId("order-reorder").click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('[data-testid^="cart-qty-"]').first()).toBeVisible();
});

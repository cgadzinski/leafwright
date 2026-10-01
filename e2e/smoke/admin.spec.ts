import { expect, test } from "@playwright/test";

test("merchant creates and publishes a product, then fulfills an order", async ({ page }) => {
  await page.goto("/sign-in?callbackUrl=%2Fadmin");
  await page.getByTestId("signin-email").fill("amari.rohan@fernhollow-nursery.example.com");
  await page.getByTestId("signin-password").fill("leafwright-demo");
  await page.getByTestId("signin-submit").click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId("admin-kpi-revenue")).toBeVisible();
  await expect(page.getByTestId("nav-admin-analytics")).toBeVisible();

  await page.goto("/admin/products");
  await page.getByTestId("products-new").click();
  await expect(page).toHaveURL(/\/admin\/products\/new$/);
  const name = `Smoke Fern ${Date.now()}`;
  await page.getByTestId("product-name").fill(name);
  await page.getByTestId("product-price").fill("24.50");
  await page.getByTestId("product-inventory").fill("7");
  await page.getByTestId("product-description").fill("A test fern from the smoke suite.");
  await page.getByTestId("product-save-draft").click();
  await expect(page).toHaveURL(/\/admin\/products\/prod_[0-9a-f]+\?saved=1$/);
  await expect(page.getByTestId("product-status")).toHaveText("draft");

  await page.getByTestId("product-publish").click();
  await expect(page).toHaveURL(/\?published=1$/);
  await expect(page.getByTestId("product-status")).toHaveText("published");

  await page.goto("/admin/orders?status=paid");
  let row = page.locator('[data-testid^="orders-row-"]').first();
  if ((await row.count()) === 0) {
    await page.goto("/admin/orders?status=placed");
    row = page.locator('[data-testid^="orders-row-"]').first();
  }
  await row.click();
  await expect(page).toHaveURL(/\/admin\/orders\/order_/);
  await page.getByTestId("order-tracking").fill("1ZSMOKE0000000001");
  await page.getByTestId("order-fulfill").click();
  await expect(page.getByRole("status")).toContainText("fulfilled");
  await expect(page.locator("[data-status=fulfilled]")).toBeVisible();
});

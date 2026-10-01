import { expect, test } from "@playwright/test";

test("anonymous shopper browses, adds to cart, and checks out as a guest", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("nav-logo")).toBeVisible();

  await page.getByTestId("home-category-tropicals").click();
  await expect(page).toHaveURL(/\/products\?category=tropicals/);

  const firstCard = page.locator('[data-testid^="catalog-card-"]').first();
  const slug = (await firstCard.getAttribute("data-testid"))!.replace("catalog-card-", "");
  await firstCard.click();
  await expect(page).toHaveURL(new RegExp(`/products/${slug}$`));

  await page.getByTestId("pdp-tab-care").click();
  await page.getByTestId("pdp-add-to-cart").click();
  await expect(page.getByRole("status")).toContainText("Added");

  await page.getByTestId("nav-cart").click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByTestId(`cart-qty-${slug}`)).toBeVisible();

  await page.getByTestId("cart-checkout").click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByTestId("checkout-email").fill("guest@example.com");
  await page.getByTestId("checkout-name").fill("Guest Shopper");
  await page.getByTestId("checkout-address1").fill("12 Fern Street");
  await page.getByTestId("checkout-city").fill("Portland");
  await page.getByTestId("checkout-region").fill("OR");
  await page.getByTestId("checkout-postal").fill("97201");
  await page.getByTestId("checkout-card-number").fill("4242 4242 4242 4242");
  await page.getByTestId("checkout-card-expiry").fill("12/30");
  await page.getByTestId("checkout-card-cvc").fill("123");
  await page.getByTestId("checkout-place-order").click();

  await expect(page).toHaveURL(/\/orders\/LW-\d{5,}\/confirmation$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thanks");
  await expect(page.getByTestId("confirmation-continue")).toBeVisible();
});

test("promo link applies a code and the cart survives signing in", async ({ page }) => {
  await page.goto("/promo/fern15");
  await expect(page).toHaveURL(/\/products$/);

  await page.goto("/stores/fernhollow-nursery");
  const quickAdd = page.locator('[data-testid^="catalog-quick-add-"]').first();
  const slug = (await quickAdd.getAttribute("data-testid"))!.replace("catalog-quick-add-", "");
  await quickAdd.click();
  await expect(page.getByTestId("nav-cart")).toContainText("1");

  await page.getByTestId("nav-cart").click();
  await expect(page.getByRole("status")).toContainText("FERN15 applied");

  await page.getByTestId("nav-sign-in").click();
  await page.getByTestId("signin-email").fill("zelda.corwin@example.com");
  await page.getByTestId("signin-password").fill("leafwright-demo");
  await page.getByTestId("signin-submit").click();
  await expect(page.getByTestId("nav-user-menu")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByTestId(`cart-qty-${slug}`)).toBeVisible();
  await expect(page.getByRole("status")).toContainText("FERN15 applied");

  await page.getByTestId(`cart-remove-${slug}`).click();
  await expect(page.getByTestId(`cart-qty-${slug}`)).toHaveCount(0);
});

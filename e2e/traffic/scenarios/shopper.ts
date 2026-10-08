import { expect } from "@playwright/test";
import { CHAT_THEN_PURCHASE_SHARE } from "../config";
import { dwell, maybeBacktrack, typeInto } from "../pacing";
import type { ShopperSession } from "../plan";
import { converse } from "./chat";
import {
  activePromoCodes,
  ADDRESSES,
  GUEST_EMAILS,
  randomProduct,
  signIn,
  type SessionRun,
} from "../session";

async function enter(run: SessionRun, session: ShopperSession): Promise<void> {
  const { page, rng, log } = run;
  switch (session.entry) {
    case "home":
      await page.goto("/");
      break;
    case "product":
      await page.goto(`/products/${randomProduct(rng).slug}`);
      break;
    case "promo":
      await page.goto(`/promo/${rng.pick(activePromoCodes)}`);
      await page.waitForURL(/\/products/, { timeout: 20_000 }).catch(() => undefined);
      break;
    case "store":
      await page.goto(
        `/stores/${rng.pick(["fernhollow-nursery", "dry-creek-succulents", "kiln-and-vine", "moss-lane"])}`,
      );
      break;
  }
  log(`entered via ${session.entry} at ${new URL(page.url()).pathname}`);
  await dwell(page, rng);
}

/** Wander from wherever we are to a product page and read it. */
async function browseToProduct(run: SessionRun): Promise<string> {
  const { page, rng, log } = run;
  const path = new URL(page.url()).pathname;
  if (!path.startsWith("/products/")) {
    if (path === "/" && rng.chance(0.6)) {
      const tiles = page.locator('[data-testid^="home-category-"]');
      await tiles.nth(rng.int(0, (await tiles.count()) - 1)).click();
      await dwell(page, rng, 0.7);
    } else if (!path.startsWith("/products") && !path.startsWith("/stores")) {
      await page.goto("/products");
      await dwell(page, rng, 0.7);
    }
    const cards = page.locator('[data-testid^="catalog-card-"], [data-testid^="home-featured-"]');
    const count = await cards.count();
    if (count === 0) {
      await page.goto(`/products/${randomProduct(rng).slug}`);
    } else {
      await cards.nth(rng.int(0, Math.min(count, 8) - 1)).click();
    }
  }
  await page.waitForURL(/\/products\/[a-z0-9-]+$/);
  await dwell(page, rng);
  for (const tab of rng.shuffle(["care", "shipping", "description"]).slice(0, rng.int(0, 2))) {
    await page.getByTestId(`pdp-tab-${tab}`).click();
    await dwell(page, rng, 0.4);
  }
  const slug = new URL(page.url()).pathname.split("/").pop()!;
  log(`viewed product ${slug}`);
  return slug;
}

/** Adds the current product; when it is sold out, moves on to another one (a couple of tries). */
async function addToCart(run: SessionRun): Promise<boolean> {
  const { page, rng, log } = run;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const button = page.getByTestId("pdp-add-to-cart");
    await button.waitFor({ state: "visible" });
    if (await button.isEnabled()) {
      if (rng.chance(0.3)) await page.getByTestId("pdp-quantity").fill(String(rng.int(1, 3)));
      await button.click();
      await expect(page.getByRole("status")).toContainText("Added", { timeout: 15_000 });
      log("added to cart");
      await dwell(page, rng, 0.5);
      return true;
    }
    log("product sold out, looking at another");
    await page.goto(`/products/${randomProduct(rng).slug}`);
    await dwell(page, rng, 0.6);
  }
  log("gave up: everything looked at was sold out");
  return false;
}

async function viewCart(run: SessionRun): Promise<void> {
  await run.page.getByTestId("nav-cart").click();
  await run.page.waitForURL(/\/cart$/);
  await dwell(run.page, run.rng);
}

async function fillShipping(run: SessionRun, email: string | undefined): Promise<void> {
  const { page, rng } = run;
  const address = rng.pick(ADDRESSES);
  if (email) await typeInto(page.getByTestId("checkout-email"), rng, email);
  await typeInto(page.getByTestId("checkout-name"), rng, address.name);
  await typeInto(page.getByTestId("checkout-address1"), rng, address.address1);
  await typeInto(page.getByTestId("checkout-city"), rng, address.city);
  await typeInto(page.getByTestId("checkout-region"), rng, address.region);
  await typeInto(page.getByTestId("checkout-postal"), rng, address.postal);
  if (rng.chance(0.3))
    await page
      .getByTestId("checkout-shipping-method")
      .getByLabel(/Express/)
      .check();
}

async function payAndPlace(run: SessionRun): Promise<void> {
  const { page, rng, log } = run;
  await typeInto(page.getByTestId("checkout-card-number"), rng, "4242 4242 4242 4242");
  await typeInto(page.getByTestId("checkout-card-expiry"), rng, "12/30");
  await typeInto(page.getByTestId("checkout-card-cvc"), rng, "123");
  await dwell(page, rng, 0.4);
  await page.getByTestId("checkout-place-order").click();
  await page.waitForURL(/\/orders\/LW-\d+\/confirmation$/, { timeout: 30_000 });
  log(`placed order ${new URL(page.url()).pathname.split("/")[2]}`);
  await dwell(page, rng);
  if (rng.chance(0.5)) await page.getByTestId("confirmation-continue").click();
}

async function checkout(
  run: SessionRun,
  session: ShopperSession,
  abandonAtPayment: boolean,
): Promise<void> {
  const { page, rng, log } = run;
  await viewCart(run);
  if (rng.chance(0.2) && activePromoCodes.length) {
    await typeInto(page.getByTestId("cart-promo-input"), rng, rng.pick(activePromoCodes));
    await page.getByTestId("cart-promo-apply").click();
    await dwell(page, rng, 0.5);
  }
  await page.getByTestId("cart-checkout").click();
  await page.waitForURL(/\/checkout$/);
  await dwell(page, rng);

  const signedIn = Boolean(session.visitor);
  const guestEmail = signedIn ? undefined : rng.pick(GUEST_EMAILS);
  await fillShipping(run, guestEmail);
  if (abandonAtPayment) {
    log("left at the payment step");
    return;
  }
  await payAndPlace(run);
}

async function chat(run: SessionRun): Promise<boolean> {
  const { page, rng, log } = run;
  await page.getByTestId("assistant-toggle").click();
  await expect(page.getByTestId("chat-panel")).toBeVisible();
  await dwell(page, rng, 0.5);
  const scope = await converse(run, "shopper");
  const reply = page.locator('[data-role="assistant"]').last();
  const link = reply.locator('a[href^="/products/"]').first();
  if (scope === "supported" && (await link.count()) > 0 && rng.chance(CHAT_THEN_PURCHASE_SHARE)) {
    const href = await link.getAttribute("href");
    await link.click();
    await page.waitForURL(/\/products\/[a-z0-9-]+$/);
    // The panel stays open across navigation; close it to get at the page.
    await page.getByTestId("chat-close").click();
    await dwell(page, rng);
    log(`followed the assistant's link to ${href}`);
    return true;
  }
  await page.getByTestId("chat-close").click();
  return false;
}

export async function runShopperSession(run: SessionRun, session: ShopperSession): Promise<void> {
  const { page, rng, log } = run;
  if (session.visitor) {
    const ok = await signIn(run, session.visitor, "/");
    if (!ok) return;
  }
  await enter(run, session);

  switch (session.scenario) {
    case "browse": {
      const pages = rng.int(1, 3);
      for (let i = 0; i < pages; i += 1) {
        await browseToProduct(run);
        await maybeBacktrack(page, rng);
        if (i < pages - 1)
          await page.goto(
            rng.chance(0.5)
              ? "/products"
              : `/products?category=${rng.pick(["tropicals", "succulents", "planters", "tools", "rare"])}`,
          );
      }
      log("browsed and left");
      return;
    }
    case "add-to-cart-and-leave": {
      await browseToProduct(run);
      if (!(await addToCart(run))) return;
      if (rng.chance(0.6)) await viewCart(run);
      log("left with items in the cart");
      return;
    }
    case "abandon-at-payment": {
      await browseToProduct(run);
      if (!(await addToCart(run))) return;
      await checkout(run, session, true);
      return;
    }
    case "purchase": {
      await browseToProduct(run);
      if (!(await addToCart(run))) return;
      if (rng.chance(0.4)) {
        await page.goto("/products");
        await dwell(page, rng, 0.6);
        await browseToProduct(run);
        await addToCart(run);
      }
      await checkout(run, session, false);
      return;
    }
    case "chat": {
      const continued = await chat(run);
      if (continued && (await addToCart(run))) {
        await checkout(run, session, false);
      }
      return;
    }
  }
}

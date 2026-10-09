import { expect } from "@playwright/test";
import { FULFILL_SHARE, PRODUCT_FORM_ABANDON_SHARE } from "../config";
import { dwell, typeInto } from "../pacing";
import type { MerchantSession } from "../plan";
import { signIn, type SessionRun } from "../session";
import { converse } from "./chat";

const PRODUCT_NAMES = [
  "Seasonal Fern Mix",
  "Windowsill Herb Trio",
  "Hanging Hoya Cutting",
  "Speckled Stoneware Saucer",
  "Bench Pruner Set",
  "Dwarf Monstera Starter",
  "Trailing Pothos Basket",
  "Succulent Gift Box",
];

async function dashboard(run: SessionRun): Promise<void> {
  const { page, rng, log } = run;
  await page.waitForURL(/\/admin/);
  await expect(page.getByTestId("admin-kpi-revenue")).toBeVisible();
  await dwell(page, rng);
  if ((await page.getByTestId("nav-admin-analytics").count()) > 0 && rng.chance(0.6)) {
    await page.getByTestId("nav-admin-analytics").click();
    await page.waitForURL(/\/admin\/analytics/);
    await dwell(page, rng);
    if (rng.chance(0.5)) {
      await page.getByTestId("analytics-date-range").click();
      await page.getByRole("option", { name: /90 days/ }).click();
      await dwell(page, rng, 0.6);
    }
  }
  log("checked the dashboard");
}

async function fulfillOrders(run: SessionRun): Promise<void> {
  const { page, rng, log } = run;
  await page.goto("/admin/orders");
  await dwell(page, rng, 0.7);
  const open = rng.int(2, 3);
  let fulfilled = 0;
  for (let i = 0; i < open; i += 1) {
    await page.goto(`/admin/orders?status=${rng.chance(0.5) ? "paid" : "placed"}`);
    await dwell(page, rng, 0.5);
    const rows = page.locator('[data-testid^="orders-row-"]');
    const count = await rows.count();
    if (count === 0) {
      await page.goto("/admin/orders");
      await dwell(page, rng, 0.5);
      const anyRows = page.locator('[data-testid^="orders-row-"]');
      if ((await anyRows.count()) === 0) break;
      await anyRows.nth(rng.int(0, Math.min(await anyRows.count(), 10) - 1)).click();
      await dwell(page, rng);
      continue;
    }
    await rows.nth(rng.int(0, Math.min(count, 6) - 1)).click();
    await page.waitForURL(/\/admin\/orders\/order_/);
    await dwell(page, rng);
    const fulfill = page.getByTestId("order-fulfill");
    if (await fulfill.isEnabled()) {
      if (rng.chance(FULFILL_SHARE)) {
        if (rng.chance(0.7))
          await typeInto(
            page.getByTestId("order-tracking"),
            rng,
            `1Z${rng.int(100000000, 999999999)}LW`,
          );
        await fulfill.click();
        await expect(page.getByRole("status")).toContainText("fulfilled", { timeout: 15_000 });
        fulfilled += 1;
      } else if (rng.chance(0.3)) {
        await typeInto(
          page.getByTestId("order-note"),
          rng,
          "Packing tomorrow morning; heat pack added.",
        );
        await page.getByTestId("order-note-submit").click();
        await dwell(page, rng, 0.4);
      }
    }
    await dwell(page, rng, 0.5);
  }
  log(`opened ${open} orders, fulfilled ${fulfilled}`);
}

async function productForm(run: SessionRun, publish: boolean): Promise<void> {
  const { page, rng, log } = run;
  await page.goto("/admin/products");
  await dwell(page, rng, 0.6);
  await page.getByTestId("products-new").click();
  await page.waitForURL(/\/admin\/products\/new$/);
  await dwell(page, rng, 0.6);
  const name = `${rng.pick(PRODUCT_NAMES)} ${rng.pick(["Batch", "Lot", "Bench", "Flat"])} ${rng.int(1000, 9999)}`;
  await typeInto(page.getByTestId("product-name"), rng, name);
  await typeInto(
    page.getByTestId("product-price"),
    rng,
    `${rng.int(12, 89)}.${rng.pick(["00", "50", "99"])}`,
  );
  await typeInto(page.getByTestId("product-inventory"), rng, String(rng.int(3, 30)));
  if (rng.chance(PRODUCT_FORM_ABANDON_SHARE)) {
    log("abandoned the product form");
    await page.goto("/admin");
    return;
  }
  await typeInto(
    page.getByTestId("product-description"),
    rng,
    "Grown on the back bench this season. Ships bare-root with a care card.",
  );
  await page.getByTestId("product-save-draft").click();
  await page.waitForURL(/\/admin\/products\/prod_[0-9a-f]+\?saved=1$/, { timeout: 30_000 });
  await dwell(page, rng);
  if (!publish) {
    log(`saved draft "${name}"`);
    return;
  }
  await page.getByTestId("product-publish").click();
  await page.waitForURL(/\?published=1$/, { timeout: 30_000 });
  log(`published "${name}"`);
  await dwell(page, rng, 0.5);
}

async function chat(run: SessionRun, intent?: string): Promise<void> {
  const { page, rng, log } = run;
  if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
    await page.goto("/admin");
    await dwell(page, rng, 0.5);
  }
  await page.getByTestId("admin-ask-assistant").click();
  await expect(page.getByTestId("chat-panel")).toBeVisible();
  await dwell(page, rng, 0.5);
  await converse(run, "merchant", intent);
  log("talked to the assistant");
}

async function extra(run: SessionRun, session: MerchantSession): Promise<void> {
  const { page, rng, log } = run;
  switch (session.extra) {
    case "export-orders": {
      await page.goto("/admin/orders");
      await dwell(page, rng, 0.5);
      const download = page.waitForEvent("download", { timeout: 30_000 });
      await page.getByTestId("orders-export").click();
      const file = await download;
      log(`exported ${file.suggestedFilename()}`);
      return;
    }
    case "edit-promo": {
      await page.goto("/admin/promos");
      await dwell(page, rng, 0.5);
      const rows = page.locator('[data-testid^="promos-row-"]');
      await rows.nth(rng.int(0, (await rows.count()) - 1)).click();
      await page.waitForURL(/\/admin\/promos\/promo_/);
      await dwell(page, rng);
      const ends = page.getByTestId("promo-ends-at");
      const future = new Date(Date.now() + rng.int(30, 120) * 864e5).toISOString().slice(0, 10);
      await ends.fill(future);
      await page.getByTestId("promo-save").click();
      await page.waitForURL(/\/admin\/promos\?saved=1$/, { timeout: 30_000 });
      log("edited a promo");
      return;
    }
    case "visit-billing": {
      await page.goto("/admin/settings/billing");
      await dwell(page, rng);
      await page.getByTestId("settings-nav-team").click();
      await dwell(page, rng, 0.5);
      log("looked at billing");
      return;
    }
    default:
      return;
  }
}

export async function runMerchantSession(run: SessionRun, session: MerchantSession): Promise<void> {
  const { page, rng, log } = run;
  const ok = await signIn(run, session.visitor, "/admin", false);
  if (!ok) return;
  await dashboard(run);

  switch (session.scenario) {
    case "dashboard-check":
      if (rng.chance(0.5)) {
        await page.goto("/admin/orders");
        await dwell(page, rng);
      }
      break;
    case "fulfill-orders":
      await fulfillOrders(run);
      break;
    case "create-and-publish-product":
      await productForm(run, true);
      break;
    case "draft-only":
      await productForm(run, false);
      break;
    case "chat":
      await chat(run, session.intent);
      break;
  }
  if (session.extra) await extra(run, session);
  log("done");
}

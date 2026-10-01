# Decisions

Choices made where `SPEC.md` is silent or where the stack has moved since it was written.
Newest at the bottom.

## Milestone 0: scaffold

- **Package versions.** Next.js 16.3.8, React 19.3, TypeScript 5.9.3 (pinned with `~` because
  TypeScript 7 is already on npm and the spec asks for 5.9), Tailwind 4.3, ESLint 9.39 (ESLint 10
  is out; the spec asks for a 9 flat config), Prettier 3.9, Vitest 5.0, Playwright 1.63.0, Zod 4,
  Auth.js `5.0.0-beta.32`, `@anthropic-ai/sdk` 0.131 (the spec's 0.130 has been superseded by a
  patch release in the same line).
- **Node.** Local machine runs Node 26; `engines` asks for `>=24` as the spec says, and CI uses 24.
- **shadcn/ui.** Initialized with the `radix` component base and the `nova` preset, neutral base
  color, CSS variables. shadcn 4 ships `radix-ui` as one package and `cn` as a dependency; we keep
  its generated `lib/utils.ts` as the `cn` export.
- **Request guard file.** Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` (same
  mechanism, Node runtime, deprecation warning on the old name). The guard the spec calls
  `middleware.ts` lives at `proxy.ts` with a `proxy` export.
- **Scripts.** `typecheck` is `tsc --noEmit`; `lint` is `eslint .`; `test` is `vitest run`;
  `e2e:smoke` is the `smoke` Playwright project from `e2e/playwright.config.ts`. The traffic bot
  gets its own config under `e2e/traffic/`.
- **Vitest environment.** Node by default; `components/**` tests run under jsdom.
- **Formatting.** Prettier with the Tailwind class-sorting plugin, 100-column width, double
  quotes, trailing commas. `eslint-config-prettier` turns off conflicting ESLint style rules.
- **pnpm.** `minimumReleaseAge` is set to 0 in `pnpm-workspace.yaml` so freshly released
  framework patches install without the loose-mode warnings pnpm 11 prints otherwise. Build
  scripts are allowed for `esbuild` and `sharp` only.

## Milestone 1: data layer and seed

- **Money as integer cents.** Every price, total, and fixed promo value is an integer number of
  cents. `formatMoney` in `lib/commerce/cart.ts` renders it.
- **Dates as ISO strings.** Entities store timestamps as ISO 8601 strings (`z.iso.datetime()`)
  so the JSON seed and the KV adapter round-trip without conversion.
- **Ids.** Seed ids are readable and sequential (`store_fernhollow`, `prod_0042`, `order_0160`).
  App-created records use `newId(prefix)` from `lib/db/ids.ts` (prefix plus 16 hex chars).
- **`source` field.** `Product`, `Order`, and `Conversation` carry `source: "seed" | "app" |
"bot"` (default `app`). SPEC §12 needs `source: "bot"` on bot-created records; the repository
  gives bot records a 14-day TTL on write so the KV adapter can expire them (SPEC §9).
- **One order per store.** A cart can hold products from several stores, but `Order.storeId` is
  singular, so checkout creates one order per store in the cart. Pricing in `priceCart` groups
  lines by store; shipping and tax are computed per group and a promo only discounts the lines
  of the store that issued it. The confirmation page shows the first order and links to siblings.
- **Pricing rules.** Standard shipping is $7.99 per store, free when that store's discounted
  subtotal reaches $75; express is $14.99. Tax is a flat 8% of the discounted subtotal. Percent
  promos round to the nearest cent and are capped at the subtotal; fixed promos are capped at the
  subtotal; `free_shipping` zeroes that store's shipping.
- **One cart line per product.** Adding a product that is already in the cart increments its
  quantity and, if a pot size was chosen, switches the line to that size. This keeps
  `cart-qty-{slug}` and `cart-remove-{slug}` unique per page as SPEC §4 requires.
- **Cart merge.** Anonymous lines are added to the user's cart (quantities summed); the user's
  promo code wins, otherwise the anonymous code carries over.
- **Passwords.** `passwordHash` is `scrypt$<salt>$<key>` from `lib/auth/password.ts`. Seeded
  hashes are of `leafwright-demo`; `DEMO_PASSWORD` (SPEC §10 "overridable by env") is also
  accepted for every seeded user at sign-in.
- **Repository shape.** `lib/db/index.ts` exports a `db` object with per-collection methods
  (`list`, `getById`, `getBySlug`, `create`, `update`, …) over an `Adapter` with four generic
  operations (`get`, `list`, `put`, `remove`). Writes are re-validated through the entity schema.
  The memory adapter keeps its tables on `globalThis` so dev hot reloads keep mutations.
- **Product search.** Catalog search matches name, description, and category, case-insensitive.
  Sort options are `featured` (name), `newest`, `price-asc`, `price-desc`.
- **Seed reference date.** The generator uses a fixed "now" of 2026-10-01T12:00Z and faker seed
  `20261001`. Orders span the 90 days before it. Moss Lane's trial ends 11 days after it.
- **Images.** Each category has one self-hosted SVG card art in `public/products/`. The spec's
  "few public-domain photos" were skipped so the repo has no third-party assets to attribute;
  products reference the category art.
- **Variants.** Tropicals and rare plants ship in 4"/6"/8" pots, succulents in 2"/4", planters in
  Small/Medium/Large, tools have no variants. Product `inventory` is the sum of variant inventory
  when variants exist.
- **Seed distribution.** 48 published / 8 draft / 4 archived products; orders split 60/40/40/20
  across Fernhollow, Dry Creek, Kiln & Vine, Moss Lane; 23 guest orders; 30 with a promo.

## Milestone 2: auth

- **Guard file.** The route guard is `proxy.ts` exporting `proxy = auth(...)` with a matcher for
  `/admin/:path*` and `/account/:path*`, as Auth.js documents for Next.js 16. Signed-out users
  are sent to `/sign-in?callbackUrl=…`; signed-in shoppers who hit `/admin` are sent home.
- **Callbacks as plain functions.** `jwtCallback` and `sessionCallback` live in
  `lib/auth/callbacks.ts` with injectable dependencies (`stampSignIn`, `loadStore`) so they are
  unit-tested without Auth.js. `auth.ts` just forwards to them.
- **Fresh store on every session read.** The `session` callback loads the store by id each time
  rather than copying plan/trial onto the token, so a plan change shows up without re-signing in.
- **`trustHost: true`.** The demo runs on localhost, Vercel previews, and GitHub Actions; host
  trust is on rather than enumerated.
- **Sign-in form.** A client component with `useActionState` posting to a Server Action that calls
  `signIn("credentials", …)` and maps `AuthError` to one generic message. Only same-origin paths
  are honored as `callbackUrl` (`lib/auth/callback-url.ts`).
- **Local env.** `.env.local` (gitignored) holds `AUTH_SECRET` and `DEMO_PASSWORD` for `pnpm dev`.

## Milestone 3: storefront

- **Anonymous cart in the cookie itself.** The signed `lw_cart` cookie carries `{ id, lines,
promoCode }` (HMAC-SHA256 with `AUTH_SECRET`, `lib/cookies.ts`), so guests need no server
  state. Signed-in users' carts live in the `carts` collection keyed by `userId`. At sign-in the
  action verifies credentials, merges the cookie cart into the stored cart, deletes the cookie,
  then hands off to Auth.js.
- **Server Actions per route folder.** `cart/actions.ts` (add, update line, remove, apply/remove
  promo), `checkout/actions.ts` (`placeOrder`), `stores/[slug]/actions.ts` (`followStore`),
  `sign-in/actions.ts`. Non-action helpers (schemas, `saveAddress`) live under `lib/orders/` so a
  `"use server"` file exports only actions.
- **Catalog filtering on the client.** `/products` loads every published product on the server
  and a client view reads `?category=`, `?sort=`, `?q=` with `useSearchParams` (SPEC §3), filters
  and sorts in memory, and rewrites the URL from the two shadcn selects.
- **Quick add** uses the first variant and quantity 1 and only refreshes the cart badge; the PDP
  add shows an inline "Added …" status via `useActionState`.
- **Save for later** (`pdp-save`) keeps slugs in `localStorage`; there is no saved-items entity in
  SPEC §9 and the control is slated for removal in backlog #3.
- **Checkout address needs a state.** SPEC §4 lists name, address 1/2, city, postal, phone; a US
  address also needs a region, so `checkout-region` was added and recorded in `TESTIDS.md`. Guests
  get a `checkout-sign-in` link; the save-address checkbox is shown to signed-in users only.
- **Orders are created as `paid`.** There is no payment provider (SPEC §15); a Luhn-valid card with
  an unexpired `MM/YY` and 3–4 digit code is accepted and the order skips `placed`.
- **Inventory and promo usage** are decremented/incremented in `placeOrder`; the cart is cleared
  and the user lands on the first order's confirmation. Sibling orders from the same checkout are
  linked from the confirmation.
- **Guest access to confirmations.** A signed `lw_orders` cookie remembers up to 20 order numbers
  placed in this browser. Signed-in buyers and the order's merchants can always view it.
- **Promo landing is a page, not a route handler.** `/promo/[code]` renders a client component
  that calls the `applyPromoCode` action on mount and then replaces the URL with `/products`.
  Server components cannot set cookies, and the client hop is where the analytics call will live.
- **Bot marker.** `placeOrder` stamps `source` from the `lw_source` cookie (`bot` when present),
  read by `lib/request-source.ts`. The traffic bot sets that cookie on its contexts.
- **Assistant toggle** is wired to an `AssistantProvider` context now so the header control exists;
  the panel itself arrives in milestone 6, and `/help` opens it on mount.

## Milestone 4: account

- **Shared chrome.** `(account)` reuses the storefront header, footer, and assistant context via
  `components/storefront/storefront-chrome.tsx`, with a small Profile / Orders sub-nav.
- **Order history includes guest orders.** `ordersForUser` returns orders with the user's
  `customerId` plus guest orders placed under the same email, which is what the help page promises.
- **Refund request is a note.** `Order` in SPEC §9 has no refund-request field, so
  `requestRefund` appends a note beginning "Refund requested by customer:" with the reason. The
  merchant order page surfaces it and the merchant's `refundOrder` action settles it. One request
  per order; refunded orders cannot request again.
- **Reorder** adds every still-published line to the cart (falling back to the first variant if the
  ordered pot size is gone) and redirects to `/cart`; it fails softly when nothing is available.
- **Profile** edits name and phone; email is read-only because it is the sign-in identity.
- **Addresses** can be added, removed, and made default from the profile; the first address a
  user saves becomes the default. Address inputs got `account-address-{field}` test ids
  (`TESTIDS.md`).

## Milestone 5: admin

- **Merchant guard in the layout.** `requireMerchant()` (`lib/auth/merchant.ts`) runs in the
  `(admin)` layout and every admin page, on top of `proxy.ts`, and loads the store fresh from
  the data layer. Actions use `currentMerchant()` which returns null instead of redirecting.
- **Flags.** `lib/flags.config.ts` holds `FLAGS` and the in-memory flag table with a
  `contextEvaluator` that turns `merchant-analytics` on when `plan === "pro"`. `lib/flags.ts`
  configures the web SDK; `lib/flags.server.ts` the server SDK. `FlagsProvider` registers the
  provider during the first client render with the store's plan as context, and wraps
  `OpenFeatureProvider` with suspense off so the nav never suspends. The analytics nav link uses
  `useBooleanFlagValue`; the analytics page uses the server SDK and renders an upsell when off.
- **Dashboard KPIs** cover the trailing 30 days versus the 30 before. Conversion has no session
  data behind it, so it is checkout conversion: orders ÷ (orders + carts still holding the
  store's products). The tile says so.
- **Product form.** One form, two Server Actions: `saveProduct` keeps a published product
  published (its button reads "Save changes") and otherwise saves a draft; `publishProduct`
  saves and publishes. Both redirect to the edit page with `?saved=1` / `?published=1`.
  `archiveProduct` is a separate form in the sidebar. Variants are shown but not edited; new
  products start without variants and use the category card art.
- **Prices in the form are dollars** (`24.50`) and stored as cents.
- **Orders list filters** live in the URL (`?status=&from=&to=`) and are parsed leniently by
  `lib/admin/order-filters.ts`; the CSV export route handler reads the same query string so the
  download matches the table. Dates are inclusive UTC days.
- **Order status transitions.** Fulfill is allowed from `placed` or `paid` and stamps
  `fulfilledAt` plus an optional tracking number; refund is allowed from any status but
  `refunded`. Customer refund requests (notes) are called out above the order.
- **Customers** are derived, not stored: shopper users and guest emails joined to the store's
  orders. Guest customer ids are `guest-<base64url email>` so the detail route works for them.
- **Promos.** Codes are unique across stores (the storefront looks codes up globally). Percent
  promos store the percentage, fixed promos store cents, free shipping stores 0. The list toggle
  flips `isActive`; the detail form handles everything else and `new` is a valid id.
- **Settings.** Four sections under `/admin/settings/[section]`; `/admin/settings` redirects to
  `store`. The slug is shown read-only so storefront links stay stable. Invites, plan changes, and
  payout edits are owner-only (SPEC §15 allows owner vs staff); staff see disabled controls.
  Payouts keep only the last four digits of the account number.
- **Analytics** renders a CSS bar chart of daily revenue, top products, and median fulfillment
  time for a 7 / 30 / 90 day range chosen with `analytics-date-range`.

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

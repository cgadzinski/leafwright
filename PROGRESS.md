# Progress

Checklist by milestone. Gate output is quoted under each milestone when it passes.

## 0. Scaffold

- [x] Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind 4, pnpm
- [x] shadcn/ui initialized (Radix base) with the component set the app uses
- [x] ESLint 9 flat config, Prettier 3
- [x] Vitest 5 config and a first unit test
- [x] Playwright 1.63 config with a `smoke` project
- [x] Route groups `(storefront)`, `(account)`, `(admin)` with layouts
- [x] `CLAUDE.md` stating rules 1–8
- [x] `.env.example` with every variable from SPEC §12
- [x] `.gitignore` includes `NOVA-*.md`
- [x] Gates passed and quoted

### Summary

Shipped the Next.js 16 scaffold with shadcn/ui, route groups, lint/format/test/e2e tooling,
repo docs, and env example. Open question: SPEC §10 names `middleware.ts`; Next.js 16 deprecates
that filename in favor of `proxy.ts`, so the guard will live there (see `DECISIONS.md`).

```
$ pnpm typecheck
Generating route types...
✓ Types generated successfully

$ pnpm lint
(no output: 0 problems)

$ pnpm test
 Test Files  1 passed (1)
      Tests  2 passed (2)

$ pnpm build
✓ Compiled successfully in 230ms
  Finished TypeScript in 918ms ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 163ms
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

## 1. Data layer and seed

- [x] `lib/db/schema.ts` with every entity in SPEC §9
- [x] Repository API in `lib/db/index.ts`
- [x] Memory adapter
- [x] `scripts/seed.ts` with a fixed faker seed
- [x] Committed `seed/*.json` at SPEC §9 counts (4 / 60 / 12+40 / 160 / 8 / 20)
- [x] Unit tests: cart totals, promo rules, order number generation (plus password and repository)
- [x] Gates passed and quoted

### Summary

Shipped Zod entity schemas, the repository over a generic adapter, the memory adapter with
hot-reload-safe tables, pricing and promo rules, order numbering, scrypt password hashing, the
seed generator, and committed seed JSON. Open question: product photos were skipped in favor of
category SVG art only (see `DECISIONS.md`).

```
$ pnpm typecheck
Generating route types...
✓ Types generated successfully

$ pnpm lint
(no output: 0 problems)

$ pnpm test
 Test Files  6 passed (6)
      Tests  39 passed (39)

$ pnpm build
✓ Compiled successfully in 359ms
  Finished TypeScript in 1295ms ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 165ms
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

## 2. Auth

- [x] Auth.js v5 credentials provider
- [x] `jwt` and `session` callbacks, `session.store` nullable
- [x] Request guards for `/admin/**` and `/account/**` (`proxy.ts`)
- [x] `/sign-in` page
- [x] Shared demo password from env
- [x] Unit tests for the callbacks (plus credentials and callback URL)
- [x] Gates passed and quoted

### Summary

Shipped Auth.js v5 with a Credentials provider over the seeded users, JWT sessions, `session.store`
for merchants and `null` for shoppers, the `proxy.ts` guard, the `/sign-in` page, and a
`SessionProvider` in the root layout. Verified live with curl: sign-in sets the session cookie,
`/api/auth/session` returns the store for a Fernhollow owner, `/admin` and `/account/*` redirect
to `/sign-in?callbackUrl=…` when signed out.

```
$ pnpm typecheck
Generating route types...
✓ Types generated successfully

$ pnpm lint
(no output: 0 problems)

$ pnpm test
 Test Files  9 passed (9)
      Tests  51 passed (51)

$ pnpm build
✓ Compiled successfully in 1029ms
  Finished TypeScript in 1677ms ...
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
└ ƒ /sign-in
ƒ Proxy (Middleware)
```

## 3. Storefront

- [x] Routes 1–10 with every control in SPEC §4 (`pdp-save` stores to localStorage; see `DECISIONS.md`)
- [x] Anonymous cookie cart merging at sign-in
- [x] Guest checkout
- [x] Server Actions for all storefront mutations (`addToCart`, `removeFromCart`, `updateCartLine`, `applyPromo`, `placeOrder`, `followStore`)
- [x] `/promo/[code]` auto-apply
- [x] Confirmation page
- [x] Smoke: anonymous browse → add to cart → guest checkout → confirmation (plus promo link + cart merge at sign-in)
- [x] Gates passed and quoted

### Summary

Shipped the storefront: global chrome (logo, shop, search, cart badge, assistant toggle, sign-in /
user menu / sign-out, admin link for merchants), home with category tiles, featured products, promo
banner and nurseries, client-filtered catalog with quick add, product detail with pot size,
quantity, tabs, save for later and store link, store page with follow, cart with line controls and
promo form, guest or signed-in checkout with Luhn-checked card, order confirmation with guest
access, promo landing, and help. Two Playwright smoke tests cover the guest purchase funnel and the
promo link plus cart merge at sign-in. Open questions: `checkout-region` was added beyond SPEC §4
(a US address needs a state); product photos remain SVG art.

```
$ pnpm typecheck
Generating route types...
✓ Types generated successfully

$ pnpm lint
(no output: 0 problems)

$ pnpm test
 Test Files  11 passed (11)
      Tests  57 passed (57)

$ pnpm build
✓ Compiled successfully in 541ms
  Finished TypeScript in 1423ms ...
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /cart
├ ƒ /checkout
├ ƒ /help
├ ƒ /orders/[orderNumber]/confirmation
├ ƒ /products
├ ƒ /products/[slug]
├ ƒ /promo/[code]
├ ƒ /sign-in
└ ƒ /stores/[slug]
ƒ Proxy (Middleware)

$ pnpm e2e:smoke
Running 2 tests using 1 worker
  ✓  1 [smoke] › e2e/smoke/storefront.spec.ts:3:5 › anonymous shopper browses, adds to cart, and checks out as a guest (2.8s)
  ✓  2 [smoke] › e2e/smoke/storefront.spec.ts:42:5 › promo link applies a code and the cart survives signing in (2.0s)
  2 passed (6.6s)
```

## 4. Account

- [x] Routes 11–13
- [x] Profile save, addresses (add, remove, make default)
- [x] Reorder, refund request
- [x] Gates passed and quoted

### Summary

Shipped the account area under the shared storefront chrome: profile form, saved addresses with
add / remove / default, order history that also lists guest orders under the same email, and order
detail with reorder (back to `/cart`) and refund request (recorded as a customer note; see
`DECISIONS.md`). Added an account smoke test; smoke tests now use distinct seeded shoppers so they
do not share cart state on one server.

```
$ pnpm typecheck
Generating route types...
✓ Types generated successfully

$ pnpm lint
(no output: 0 problems)

$ pnpm test
 Test Files  12 passed (12)
      Tests  59 passed (59)

$ pnpm build
✓ Compiled successfully in 536ms
  Finished TypeScript in 989ms ...
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /account
├ ƒ /account/orders
├ ƒ /account/orders/[orderNumber]
├ ƒ /api/auth/[...nextauth]
├ ƒ /cart
├ ƒ /checkout
├ ƒ /help
├ ƒ /orders/[orderNumber]/confirmation
├ ƒ /products
├ ƒ /products/[slug]
├ ƒ /promo/[code]
├ ƒ /sign-in
└ ƒ /stores/[slug]
ƒ Proxy (Middleware)

$ pnpm e2e:smoke
Running 3 tests using 2 workers
  ✓  2 [smoke] › e2e/smoke/account.spec.ts:3:5 › signed-in shopper updates their profile, adds an address, and reorders (1.5s)
  ✓  1 [smoke] › e2e/smoke/storefront.spec.ts:3:5 › anonymous shopper browses, adds to cart, and checks out as a guest (2.4s)
  ✓  3 [smoke] › e2e/smoke/storefront.spec.ts:42:5 › promo link applies a code and the cart survives signing in (1.5s)
  3 passed (5.6s)
```

## 5. Admin

- [ ] Dashboard KPIs from seed orders
- [ ] Products CRUD with draft / publish / archive
- [ ] Orders with status filter, date range, CSV export route handler
- [ ] Fulfill / refund / notes
- [ ] Customers
- [ ] Promos
- [ ] Settings sections
- [ ] `merchant-analytics` OpenFeature flag, `pro` stores on
- [ ] Smoke: merchant sign-in → new product → publish → open order → fulfill
- [ ] Gates passed and quoted

## 6. Chat

- [ ] `components/chat/*`, `useChat`
- [ ] `app/api/chat/route.ts` streaming, persona from layout
- [ ] `lib/chat/` prompts, tools, provider (Claude when keyed, scripted otherwise)
- [ ] Ratings endpoint
- [ ] Smoke: open panel, send a suggestion, rate the reply
- [ ] Gates passed and quoted

## 7. Analytics wrapper

- [ ] `lib/analytics.ts`
- [ ] Three call sites from SPEC §5, nothing else
- [ ] Gates passed and quoted

## 8. Traffic bot

- [ ] `e2e/traffic/` scenarios, rotation, pacing, entry points, viewports, percentages
- [ ] `.github/workflows/traffic.yml` cron plus `workflow_dispatch` with `sessions`
- [ ] `source: "bot"` on bot-created records; nightly archive job
- [ ] Local dry run with `sessions=3`, result quoted
- [ ] Gates passed and quoted

## 9. Deploy readiness

- [ ] KV adapter behind `KV_REST_API_URL`
- [ ] `vercel.json` if needed
- [ ] `README.md`: local setup, env table, deploy steps, running the bot
- [ ] Final full gate run
- [ ] Manual steps listed

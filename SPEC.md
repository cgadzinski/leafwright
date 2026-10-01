# Leafwright — demo storefront spec

Leafwright is a demo e-commerce storefront with a merchant admin, built the way a small
product team would build it for themselves: a Next.js app, a seed data layer, a public
deploy, and a scheduled traffic bot so the site always has visitors.

Status: specification only. No app code exists yet.

---

## 1. Brand, vertical, pitch

**Brand:** Leafwright
**Vertical:** houseplants, planters, and plant-care goods, sold by independent nurseries.
**Model:** one branded storefront whose catalog is supplied by several merchant **stores**
(independent nurseries). Shoppers see one Leafwright storefront and check out once;
merchants manage their own store in `/admin`.

**Pitch.** Leafwright is where independent nurseries sell online without building a site.
Shoppers browse tropicals, succulents, planters, and care tools across every nursery on the
platform, get help choosing from an AI concierge, and check out once. Nurseries list
products, run promos, fulfill orders, and ask an AI assistant to explain their sales from a
merchant admin whose plan tier unlocks more.

**Why this vertical.** Five categories with obviously different visuals (leafy tropicals,
spiky succulents, ceramic planters, tools, rare finds), each with its own accent color and
card art, so catalog pages are visually distinct. Plant-care attributes (light, water,
pet-safe, difficulty) give the shopper assistant real things to filter on.

---

## 2. Personas and account model

| Persona           | Signs in            | Identity available after sign-in                                                     |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------ |
| Anonymous shopper | no                  | none; cart in a cookie                                                               |
| Shopper           | yes, or at checkout | user id, email, name, role, created date, last sign-in                               |
| Merchant owner    | yes                 | user fields above plus the store: id, name, slug, plan, trial end date, created date |
| Merchant staff    | yes                 | same as owner, role differs                                                          |

**Account = Store.** Every merchant user belongs to exactly one store. Shoppers belong to
no store. Plans, per store: `starter` (14-day trial), `growth`, `pro`.

Shoppers browse anonymously and are only required to sign in at checkout (guest checkout is
also allowed, with email only). Merchants must sign in to reach `/admin`.

---

## 3. Route table

Next.js App Router with route groups `(storefront)`, `(account)`, and `(admin)` for layouts.
25 routes.

### Storefront

| #   | Path                                 | Page               | Persona                  | Objects shown                                                      |
| --- | ------------------------------------ | ------------------ | ------------------------ | ------------------------------------------------------------------ |
| 1   | `/`                                  | Home               | any                      | featured products, stores, active promo                            |
| 2   | `/products`                          | Catalog            | any                      | products; `?category=`, `?sort=`, `?q=` read via `useSearchParams` |
| 3   | `/products/[slug]`                   | Product detail     | any                      | product, store; description / care / shipping tabs are local state |
| 4   | `/stores/[slug]`                     | Store page         | any                      | store, its products                                                |
| 5   | `/cart`                              | Cart               | any                      | cart, promo                                                        |
| 6   | `/checkout`                          | Checkout           | any (guest or signed in) | cart, address, payment                                             |
| 7   | `/orders/[orderNumber]/confirmation` | Order confirmation | buyer                    | order                                                              |
| 8   | `/promo/[code]`                      | Promo landing      | any                      | promo; applies code, redirects to `/products`                      |
| 9   | `/help`                              | Help               | any                      | FAQ, assistant panel open by default                               |
| 10  | `/sign-in`                           | Sign in            | anonymous                |                                                                    |

### Account

| #   | Path                            | Page          | Persona | Objects shown         |
| --- | ------------------------------- | ------------- | ------- | --------------------- |
| 11  | `/account`                      | Profile       | shopper | user, saved addresses |
| 12  | `/account/orders`               | Order history | shopper | orders                |
| 13  | `/account/orders/[orderNumber]` | Order detail  | shopper | order                 |

### Merchant admin

| #   | Path                        | Page            | Persona  | Objects shown                                        |
| --- | --------------------------- | --------------- | -------- | ---------------------------------------------------- |
| 14  | `/admin`                    | Dashboard       | merchant | store KPIs, recent orders                            |
| 15  | `/admin/products`           | Products        | merchant | products; `?status=` filter                          |
| 16  | `/admin/products/new`       | New product     | merchant | product form                                         |
| 17  | `/admin/products/[id]`      | Edit product    | merchant | product                                              |
| 18  | `/admin/orders`             | Orders          | merchant | orders; `?status=` filter, date range                |
| 19  | `/admin/orders/[id]`        | Order detail    | merchant | order, customer                                      |
| 20  | `/admin/customers`          | Customers       | merchant | customers                                            |
| 21  | `/admin/customers/[id]`     | Customer detail | merchant | customer, their orders                               |
| 22  | `/admin/promos`             | Promos          | merchant | promos                                               |
| 23  | `/admin/promos/[id]`        | Promo detail    | merchant | promo (`new` is also a valid id)                     |
| 24  | `/admin/settings/[section]` | Settings        | merchant | store, team, billing, payouts (four nested sections) |
| 25  | `/admin/analytics`          | Analytics       | merchant | store sales; behind the feature flag (§8)            |

Products use slugs on the storefront and ids in admin. Orders use human order numbers
(`LW-10421`) on the storefront and internal ids in admin. That is how most commerce stacks
end up, and it means the same object has two URL shapes.

---

## 4. Feature inventory

Convention: `data-testid="{area}-{object}-{action}"`, kebab-case, unique per page, applied
by the developer to every interactive element the app renders. UI primitives come from
shadcn/ui (Radix), so some inner elements (select options, popover contents, calendar
cells) are third-party markup without our test ids; the trigger has one.

### Global chrome

| Element                        | `data-testid`                                  | Why it matters     |
| ------------------------------ | ---------------------------------------------- | ------------------ |
| Logo                           | `nav-logo`                                     |                    |
| Shop link                      | `nav-shop`                                     | catalog entry      |
| Search input / submit          | `nav-search-input`, `nav-search-submit`        | search action      |
| Cart button with badge         | `nav-cart`                                     | funnel step        |
| Assistant toggle               | `assistant-toggle`                             | chat entry         |
| Sign in / user menu / sign out | `nav-sign-in`, `nav-user-menu`, `nav-sign-out` | identity lifecycle |
| Admin link (merchants)         | `nav-admin`                                    | persona split      |

### Storefront

| Element                                         | `data-testid`                                                       | Page                                   |
| ----------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------- |
| Category tile (x5)                              | `home-category-{slug}`                                              | Home                                   |
| Featured product card                           | `home-featured-{slug}`                                              | Home                                   |
| Promo banner CTA                                | `home-promo-cta`                                                    | Home                                   |
| Category / sort controls                        | `catalog-category`, `catalog-sort`                                  | Catalog                                |
| Product card                                    | `catalog-card-{slug}`                                               | Catalog                                |
| Quick add                                       | `catalog-quick-add-{slug}`                                          | Catalog                                |
| Add to cart                                     | `pdp-add-to-cart`                                                   | Product detail                         |
| Quantity                                        | `pdp-quantity`                                                      | Product detail                         |
| Pot size                                        | `pdp-variant`                                                       | Product detail                         |
| Save for later                                  | `pdp-save`                                                          | Product detail (removed in backlog #5) |
| Tabs (description / care / shipping)            | `pdp-tab-{name}`                                                    | Product detail (local state)           |
| Store link                                      | `pdp-store-link`                                                    | Product detail                         |
| Follow store                                    | `store-follow`                                                      | Store page                             |
| Line quantity / remove                          | `cart-qty-{slug}`, `cart-remove-{slug}`                             | Cart                                   |
| Promo input / apply                             | `cart-promo-input`, `cart-promo-apply`                              | Cart                                   |
| Checkout                                        | `cart-checkout`                                                     | Cart                                   |
| Email                                           | `checkout-email`                                                    | Checkout                               |
| Name, address 1, address 2, city, postal, phone | `checkout-{field}`                                                  | Checkout                               |
| Shipping method                                 | `checkout-shipping-method`                                          | Checkout                               |
| Card number, expiry, CVC                        | `checkout-card-number`, `checkout-card-expiry`, `checkout-card-cvc` | Checkout                               |
| Save address                                    | `checkout-save-address`                                             | Checkout                               |
| Place order                                     | `checkout-place-order`                                              | Checkout                               |
| Continue shopping / view order                  | `confirmation-continue`, `confirmation-view-order`                  | Confirmation                           |
| Profile save, address add                       | `account-save`, `account-address-add`                               | Profile                                |
| Reorder, request refund                         | `order-reorder`, `order-refund-request`                             | Order detail                           |
| Email, password, submit                         | `signin-email`, `signin-password`, `signin-submit`                  | Sign in                                |

### Merchant admin

| Element                                | `data-testid`                                                          | Page                |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------- |
| KPI tiles (x4)                         | `admin-kpi-{revenue\|orders\|aov\|conversion}`                         | Dashboard           |
| Ask assistant                          | `admin-ask-assistant`                                                  | Dashboard           |
| Status filter, new product             | `products-status`, `products-new`                                      | Products            |
| Product row                            | `products-row-{id}`                                                    | Products            |
| Form fields                            | `product-{field}`                                                      | New / Edit product  |
| Save draft, publish, archive           | `product-save-draft`, `product-publish`, `product-archive`             | New / Edit product  |
| Status filter, date range, export      | `orders-status`, `orders-date-range`, `orders-export`                  | Orders              |
| Order row                              | `orders-row-{id}`                                                      | Orders              |
| Mark fulfilled, tracking, refund, note | `order-fulfill`, `order-tracking`, `order-refund`, `order-note-submit` | Order detail        |
| Customer row                           | `customers-row-{id}`                                                   | Customers           |
| New promo, toggle                      | `promos-new`, `promos-toggle-{id}`                                     | Promos              |
| Promo save                             | `promo-save`                                                           | Promo detail        |
| Section nav (x4)                       | `settings-nav-{section}`                                               | Settings            |
| Store fields                           | `settings-store-{field}`                                               | Settings / store    |
| Invite email, send                     | `settings-invite-email`, `settings-invite-send`                        | Settings / team     |
| Plan cards (x3)                        | `settings-plan-{plan}`                                                 | Settings / billing  |
| Payout account / routing               | `settings-payout-account`, `settings-payout-routing`                   | Settings / payouts  |
| Analytics nav link                     | `nav-admin-analytics`                                                  | Admin nav (flagged) |
| Date range                             | `analytics-date-range`                                                 | Analytics           |

Roughly 85 controls across 25 routes.

---

## 5. Untracked business actions

The app has a Segment-shaped wrapper, `lib/analytics.ts`, exporting
`analytics.track(event, properties)` and `analytics.page()`, that no-ops unless
`NEXT_PUBLIC_ANALYTICS_WRITE_KEY` is set. Three actions use it today; the team never got
around to the rest. No third-party analytics SDK is installed.

Mutations are Server Actions (`app/**/actions.ts`) that validate with Zod, write through
the data layer, and either `redirect()` or `revalidatePath()`. Several therefore have no
client-side success callback; success is the next page rendering.

| #   | Action               | Trigger                                        | Where the mutation lives                          | Status today                               |
| --- | -------------------- | ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| 1   | Add to cart          | `pdp-add-to-cart`, `catalog-quick-add-*`       | client store + `addToCart` server action          | untracked                                  |
| 2   | Remove from cart     | `cart-remove-*`                                | `removeFromCart` action                           | untracked                                  |
| 3   | Apply promo          | `cart-promo-apply`, `/promo/[code]`            | `applyPromo` action                               | **`analytics.track("Promo Applied")`**     |
| 4   | Begin checkout       | `cart-checkout`                                | `<Link>` to `/checkout`                           | untracked                                  |
| 5   | Place order          | `checkout-place-order`                         | `placeOrder` action, `redirect()` to confirmation | untracked                                  |
| 6   | Save address         | `checkout-save-address`, `account-address-add` | `saveAddress` action                              | untracked                                  |
| 7   | Search               | `nav-search-submit`                            | router push to `/products?q=`                     | **`analytics.track("Products Searched")`** |
| 8   | Follow store         | `store-follow`                                 | `followStore` action                              | untracked                                  |
| 9   | Request refund       | `order-refund-request`                         | `requestRefund` action                            | untracked                                  |
| 10  | Reorder              | `order-reorder`                                | `reorder` action                                  | untracked                                  |
| 11  | Create product draft | `product-save-draft`                           | `saveProduct` action, `redirect()` to edit page   | untracked                                  |
| 12  | Publish product      | `product-publish`                              | `publishProduct` action                           | untracked                                  |
| 13  | Archive product      | `product-archive`                              | `archiveProduct` action                           | untracked                                  |
| 14  | Fulfill order        | `order-fulfill`                                | `fulfillOrder` action                             | untracked                                  |
| 15  | Refund order         | `order-refund`                                 | `refundOrder` action                              | untracked                                  |
| 16  | Export orders CSV    | `orders-export`                                | route handler `GET /admin/orders/export`          | **`analytics.track("Orders Exported")`**   |
| 17  | Create / edit promo  | `promo-save`                                   | `savePromo` action                                | untracked                                  |
| 18  | Invite team member   | `settings-invite-send`                         | `inviteMember` action                             | untracked                                  |
| 19  | Change plan          | `settings-plan-*`                              | `changePlan` action                               | untracked                                  |

Sign-in, sign-out, and assistant usage are not in this list; they are identity and chat
events rather than business actions.

---

## 6. Funnels and where people drop off

### Shopper: browse to purchase

1. View a product detail page.
2. Add to cart.
3. Go to checkout.
4. Sign in or continue as guest.
5. Place order, land on confirmation.

Realistic drop-off, which the traffic bot reproduces: about 45% browse and leave, 35% of
cart-adders abandon the cart, 30% of checkout-starters leave at the payment step, and a
small share bounce at the sign-in prompt.

### Merchant: list to fulfill

1. Open the new-product form.
2. Save a draft.
3. Publish.
4. Open an order for that store.
5. Mark it fulfilled.

Drop-off: 20% abandon the form, 30% leave drafts unpublished for days, 25% open orders
without fulfilling in that session.

### Secondary

- Promo link → promo applied → order placed.
- Settings / billing viewed → plan changed.
- Assistant conversation → add to cart → order placed.

---

## 7. AI assistant

One chat panel, one API route, two personas chosen by context.

- `components/chat/chat-panel.tsx` renders in the storefront and admin layouts, toggled by
  `assistant-toggle`, opened by default on `/help`, and opened by `admin-ask-assistant`.
- `app/api/chat/route.ts` receives `{ conversationId, persona, messages }` and streams a
  text response. `persona` is `"shopper"` when the panel is mounted in the storefront
  layout and `"merchant"` in the admin layout.
- `lib/chat/` holds `prompts.ts` (two system prompts), `tools.ts` (search catalog, get
  product, summarize store sales), and `provider.ts`, which calls Claude via
  `@anthropic-ai/sdk` when `ANTHROPIC_API_KEY` is set and otherwise returns scripted
  answers selected by keyword with a simulated token stream.
- The hook `useChat()` in `components/chat/use-chat.ts` owns `messages`, `input`,
  `status` (`idle | streaming | error`), `submit()`, `rate(messageId, "up" | "down")`, and
  `retry(messageId)`. Ratings POST to `/api/chat/feedback` and are stored on the
  conversation.

| Persona  | Job                                                                                     | Suggested prompts                                                                     |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Shopper  | "help me choose": asks about light, pets, and space; recommends 2–3 products with links | "Low-light plant for a bedroom", "Pet-safe under $30", "Gift for a beginner"          |
| Merchant | "explain my sales": revenue trend, top products, fulfillment lag for this store         | "Why were sales down last week?", "What should I restock?", "How fast am I shipping?" |

Selectors: `chat-input`, `chat-send`, `chat-suggestion-{n}`, `chat-rate-up-{messageId}`,
`chat-rate-down-{messageId}`, `chat-retry-{messageId}`.

---

## 8. Flag-gated feature

**Feature:** merchant Analytics (`/admin/analytics` and the `nav-admin-analytics` link).
**Flag:** `merchant-analytics`, boolean, default off.

- `lib/flags.ts` exports `FLAGS = { MERCHANT_ANALYTICS: "merchant-analytics" } as const`
  and sets up `@openfeature/web-sdk` with an in-memory provider whose evaluation context
  includes the store's `plan`. `pro` stores evaluate to on.
- Gate sites use `useBooleanFlagValue(FLAGS.MERCHANT_ANALYTICS, false)` from
  `@openfeature/react-sdk`. The server component for `/admin/analytics` checks the same
  flag through the server SDK and renders an upsell when off.

---

## 9. Data model and seed data

Entities are Zod schemas in `lib/db/schema.ts` with inferred types.

| Entity         | Fields                                                                                                                                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Store`        | `id`, `slug`, `name`, `description`, `plan: "starter" \| "growth" \| "pro"`, `trialEndsAt?`, `region`, `payoutAccountLast4?`, `createdAt`                                                                                                                                                                                  |
| `User`         | `id`, `email`, `name`, `role: "shopper" \| "owner" \| "staff"`, `storeId?`, `passwordHash`, `phone?`, `followedStoreIds[]`, `createdAt`, `lastSignInAt`                                                                                                                                                                    |
| `Address`      | `id`, `userId`, `label`, `line1`, `line2?`, `city`, `region`, `postalCode`, `country`, `isDefault`                                                                                                                                                                                                                         |
| `Product`      | `id`, `storeId`, `slug`, `name`, `category`, `price`, `compareAtPrice?`, `status: "draft" \| "published" \| "archived"`, `inventory`, `images[]`, `variants[]`, `care: {light, water, petSafe, difficulty}`, `createdAt`, `publishedAt?`                                                                                   |
| `Cart`         | `id`, `userId?`, `lines[]`, `promoCode?`, `updatedAt`                                                                                                                                                                                                                                                                      |
| `Order`        | `id`, `number` (`LW-10421`), `storeId`, `customerId?`, `guestEmail?`, `lines[]`, `subtotal`, `discount`, `shipping`, `tax`, `total`, `status: "placed" \| "paid" \| "fulfilled" \| "delivered" \| "refunded"`, `shippingAddress`, `shippingMethod`, `promoCode?`, `trackingNumber?`, `notes[]`, `placedAt`, `fulfilledAt?` |
| `Promo`        | `id`, `storeId`, `code`, `type: "percent" \| "fixed" \| "free_shipping"`, `value`, `startsAt`, `endsAt`, `isActive`, `usageCount`                                                                                                                                                                                          |
| `Conversation` | `id`, `persona`, `userId?`, `storeId?`, `messages[]`, `ratings[]`, `createdAt`                                                                                                                                                                                                                                             |
| `Invite`       | `id`, `storeId`, `email`, `role`, `sentAt`                                                                                                                                                                                                                                                                                 |

Customers in admin are shopper users (or guest emails) joined to the store's orders.

### Storage

`lib/db/index.ts` exposes a small repository API over one of two adapters:

- **memory** (default): loads `seed/*.json` at boot; mutations last for the process.
  `pnpm dev` needs nothing else.
- **kv**: Upstash Redis when `KV_REST_API_URL` / `KV_REST_API_TOKEN` are set, used on
  Vercel so bot-created data survives across serverless instances. Bot-created records
  expire after 14 days; seed data does not.

Anonymous carts live in a signed cookie and merge into the user's cart at sign-in.

### Seed plan

Generated once by `scripts/seed.ts` (faker, fixed seed) and committed as JSON so ids are
stable everywhere.

| Data           | Count | Notes                                                                                                        |
| -------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| Stores         | 4     | Fernhollow Nursery (pro), Dry Creek Succulents (growth), Kiln & Vine (growth), Moss Lane (starter, in trial) |
| Products       | 60    | 15 per store, 5 categories, a handful of drafts and archived                                                 |
| Merchant users | 12    | one owner and two staff per store                                                                            |
| Shopper users  | 40    | realistic names, `@example.com` emails, 0–3 addresses                                                        |
| Orders         | 160   | last 90 days, weekday-weighted, mixed statuses, some guest                                                   |
| Promos         | 8     | two per store, one active, one expired                                                                       |
| Conversations  | 20    | with ratings                                                                                                 |

Images: self-hosted SVG card art per category plus a few public-domain photos in
`public/products/`.

---

## 10. Auth flow

Auth.js (NextAuth v5) with a Credentials provider against the seeded users, JWT sessions.

1. `/sign-in` renders a form; seeded users share the password `leafwright-demo`
   (overridable by env). Checkout offers "sign in" or "continue as guest".
2. `auth.ts` configures Auth.js. The `jwt` callback copies `role` and `storeId` onto the
   token on first sign-in and stamps `lastSignInAt` through the data layer. The `session`
   callback exposes `session.user` (`id`, `email`, `name`, `role`) and `session.store`
   (`id`, `name`, `slug`, `plan`, `trialEndsAt`) or `null`.
3. `app/layout.tsx` wraps the tree in `<SessionProvider>`; client components read identity
   with `useSession()`. Server components call `auth()`.
4. Sign-out is Auth.js `signOut()` from the user menu.
5. `middleware.ts` guards `/admin/**` (merchant roles) and `/account/**` (any signed-in
   user). Guests can complete checkout.

Identity therefore becomes available in three places a real app has: the `jwt`/`session`
callbacks on the server, the `useSession()` hook on the client after hydration, and the
`signIn` event. No single hand-rolled "onAuthenticated" exists.

---

## 11. Sensitive fields

Fields carry normal semantic attributes and nothing extra: `type="email|password|tel"`,
`name`, `autocomplete` (`cc-number`, `cc-exp`, `cc-csc`, `street-address`, `postal-code`).

| Fields                               | Where                                   |
| ------------------------------------ | --------------------------------------- |
| card number, expiry, CVC             | checkout                                |
| password                             | sign-in                                 |
| payout account and routing numbers   | settings / payouts                      |
| email, name, phone                   | checkout, sign-in, account, team invite |
| address lines, city, postal code     | checkout, account                       |
| customer email and address (display) | admin order and customer detail         |

---

## 12. Deploy plan and traffic bot

### Repo and hosting

- GitHub `pendo-io/leafwright`.
- Vercel project, production at `https://leafwright.vercel.app`, preview deploys per PR.
- Env: `AUTH_SECRET`, `DEMO_PASSWORD`, optional `ANTHROPIC_API_KEY`, optional
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`, optional `NEXT_PUBLIC_ANALYTICS_WRITE_KEY`.
- Layout: app at the root (`app/`, `components/`, `lib/`, `seed/`, `scripts/`); Playwright
  in `e2e/` holding both smoke tests and the traffic scenarios, as a normal team would.

### Traffic bot

`e2e/traffic/` is a Playwright project run by a GitHub Actions cron.

| Aspect             | Design                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schedule           | every 2 hours 06:00–23:00 UTC on weekdays, every 4 hours on weekends; manual dispatch with a `sessions` multiplier                                                                                     |
| Per run            | 10–16 shopper sessions and 3–5 merchant sessions, each a fresh browser context                                                                                                                         |
| Visitor pool       | 40 seeded shoppers and 12 merchants, rotated deterministically so everyone shows up weekly and roughly 15 are active on a given day; a share of shopper sessions stay anonymous or check out as guests |
| Account rotation   | merchant sessions cycle through all four stores every run; Fernhollow (pro) is weighted up so the flagged analytics page has users                                                                     |
| Entry points       | home 40%, product deep link 30%, promo link 15%, store page 15%                                                                                                                                        |
| Viewports          | desktop 65%, tablet 20%, mobile 15%                                                                                                                                                                    |
| Pacing             | 1.5–6 s dwell per page, human-speed typing, occasional back navigation                                                                                                                                 |
| Shopper scenarios  | browse only 35%; add to cart and leave 20%; start checkout and abandon at payment 15%; complete a purchase 20% (half as guests); chat with a rating 10%, half continuing to purchase                   |
| Merchant scenarios | dashboard check 30%; open 2–3 orders, fulfill some 30%; create and publish a product 15%; draft only 10%; chat with a rating 15%; every tenth run exports orders, edits a promo, or visits billing     |
| Hygiene            | bot-created orders and products carry `source: "bot"`; a nightly job archives bot products older than 7 days                                                                                           |
| Failures           | sessions are independent; failures are logged, traces uploaded only on failure                                                                                                                         |

The bot runs from launch day and does not block third-party scripts.

---

## 13. Tech stack

| Layer                     | Choice                                                                      | Version           | Reason                                                     |
| ------------------------- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| Framework                 | Next.js App Router                                                          | 16.x              | the default for a new React commerce app on Vercel         |
| UI                        | React, shadcn/ui on Radix, Tailwind CSS                                     | 19.x, latest, 4.x | what a typical team reaches for                            |
| Language                  | TypeScript                                                                  | 5.9               | stable tooling                                             |
| Validation                | Zod                                                                         | 4.x               | shared schemas for entities and action inputs              |
| Auth                      | Auth.js (next-auth)                                                         | 5.0 beta          | the common Next.js choice                                  |
| Flags                     | `@openfeature/web-sdk`, `@openfeature/react-sdk`, `@openfeature/server-sdk` | 1.x               | vendor-neutral flag API                                    |
| Analytics wrapper         | in-house, Segment-shaped                                                    |                   | three events wired, rest never done                        |
| LLM                       | `@anthropic-ai/sdk`                                                         | 0.130             | opt-in; scripted replies otherwise                         |
| Data                      | JSON seed, in-memory store, optional Upstash Redis                          |                   | runs with `pnpm dev` alone                                 |
| Tests                     | Vitest, Playwright                                                          | 5.x, 1.63         | unit tests for cart and promo math; e2e smoke plus traffic |
| Seed                      | `@faker-js/faker`                                                           | 10.x              | fixed seed, committed output                               |
| Package manager / runtime | pnpm, Node 24                                                               |                   |                                                            |
| Lint / format             | ESLint 9 flat config, Prettier 3                                            |                   |                                                            |

---

## 14. Follow-up backlog (ordered)

Planned post-launch work, shipped roughly weekly, one PR each.

| #   | PR                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------- |
| 1   | Rename `/products` to `/shop` with a redirect                                                           |
| 2   | Rename `pdp-add-to-cart` to `product-add-to-cart` during a PDP redesign                                 |
| 3   | Remove "Save for later"                                                                                 |
| 4   | Add `/gift-cards` with a purchase form                                                                  |
| 5   | Add product reviews: a reviews section on the PDP and a submit action                                   |
| 6   | Ship merchant analytics to all plans, then delete the `merchant-analytics` flag and gate code           |
| 7   | Add `express-checkout` behind a new flag: one-click reorder for signed-in shoppers with a saved address |
| 8   | Split `/checkout` into `/checkout/shipping`, `/checkout/payment`, `/checkout/review`                    |
| 9   | Add bulk fulfill on `/admin/orders`                                                                     |
| 10  | Add `loyaltyTier` to `User` and expose it on the session                                                |
| 11  | Replace `/promo/[code]` with `/products?promo=CODE`                                                     |
| 12  | Add `/admin/inventory` with low-stock alerts                                                            |
| 13  | Rename plan `starter` to `free` across the data model and UI                                            |

---

## 15. Non-goals

- No real payments, emails, shipping rates, or tax. Checkout accepts any Luhn-valid card.
- No real database or migrations.
- No mobile app, PWA, or offline mode.
- No third-party analytics, replay, or product-tour SDK. The in-house wrapper is the only
  instrumentation.
- No self-serve sign-up; the visitor pool is fixed.
- No SEO, i18n, or accessibility audit beyond semantic HTML and labeled inputs.
- No RBAC beyond owner vs staff.
- No LLM cost by default.
- Not a monorepo.

---

## Assumptions made without asking

- Next.js App Router over React Router; Vercel over GitHub Pages because the chat stream
  needs a server.
- Auth.js over a custom session, because that is what most Next.js customer apps use.
- Shoppers are visitor-only; merchants carry the store as the account.
- Scripted assistant replies by default to avoid API cost on a public demo.

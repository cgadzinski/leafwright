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

- [ ] `lib/db/schema.ts` with every entity in SPEC §9
- [ ] Repository API in `lib/db/index.ts`
- [ ] Memory adapter
- [ ] `scripts/seed.ts` with a fixed faker seed
- [ ] Committed `seed/*.json` at SPEC §9 counts
- [ ] Unit tests: cart totals, promo rules, order number generation
- [ ] Gates passed and quoted

## 2. Auth

- [ ] Auth.js v5 credentials provider
- [ ] `jwt` and `session` callbacks, `session.store` nullable
- [ ] Request guards for `/admin/**` and `/account/**`
- [ ] `/sign-in` page
- [ ] Shared demo password from env
- [ ] Unit tests for the callbacks
- [ ] Gates passed and quoted

## 3. Storefront

- [ ] Routes 1–10 with every control in SPEC §4
- [ ] Anonymous cookie cart merging at sign-in
- [ ] Guest checkout
- [ ] Server Actions for all storefront mutations
- [ ] `/promo/[code]` auto-apply
- [ ] Confirmation page
- [ ] Smoke: anonymous browse → add to cart → guest checkout → confirmation
- [ ] Gates passed and quoted

## 4. Account

- [ ] Routes 11–13
- [ ] Profile save, addresses
- [ ] Reorder, refund request
- [ ] Gates passed and quoted

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

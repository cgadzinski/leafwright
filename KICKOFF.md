# Kickoff prompt for implementing Leafwright

Run from `~/dev/leafwright` in a fresh Claude Code session. Move `NOVA-*.md` out of the
folder first. Suggested launch: `/loop` with the prompt below so the run self-paces
through milestones and resumes if a turn ends early.

---

You are implementing the Leafwright demo app from `SPEC.md` in this directory. The spec
is the single source of truth. Where the spec is silent, choose what a typical small
product team shipping a Next.js commerce app would choose, and record the choice in
`DECISIONS.md`. Do not add features the spec does not describe.

## Rules

1. Build it like a real product, not a demo. No comments or names that reference analytics
   vendors, scanners, instrumentation tooling, or "detection". The only analytics code is
   the in-house wrapper in `lib/analytics.ts` with exactly the three events in SPEC §5.
2. Do not open, read, or create any file whose name starts with `NOVA-`. They are out of
   scope.
3. Every interactive element gets the `data-testid` named in SPEC §4, verbatim. If you
   need an element the spec does not list, follow the `{area}-{object}-{action}` convention
   and add it to a `TESTIDS.md` appendix.
4. Mutations are Server Actions in `app/**/actions.ts`, validated with Zod, as SPEC §5
   describes. Use `redirect()` where the spec says so.
5. TypeScript strict. No `any`, no `as any`, no `@ts-ignore`. Zod schemas are the type
   source for entities and action inputs.
6. Seed data is generated once by `scripts/seed.ts` with a fixed faker seed and committed
   as JSON. Never regenerate it after milestone 1 without saying why.
7. Keep a `PROGRESS.md` checklist with one line per milestone and sub-item. Update it
   before every commit. If context is compacted, re-read `SPEC.md`, `PROGRESS.md`, and
   `DECISIONS.md` before continuing.
8. Commit at the end of every milestone with a Conventional Commits title, no ticket ids,
   on `main`. Do not push. Do not create remote repos, Vercel projects, or any external
   resource.

## Gates

A milestone is done only when all of these pass and are quoted in `PROGRESS.md`:

```
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e:smoke     # from milestone 3 onward
```

If a gate fails, fix it before moving on. Do not weaken a check to pass it.

## Milestones

0. **Scaffold.** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind 4, shadcn/ui,
   pnpm, ESLint 9 flat config, Prettier 3, Vitest 5, Playwright 1.63. Route groups
   `(storefront)`, `(account)`, `(admin)`. A `CLAUDE.md` for this repo stating rules 1–8.
   `.env.example` with every variable from SPEC §12. `.gitignore` includes `NOVA-*.md`.
1. **Data layer and seed.** `lib/db/schema.ts` with every entity in SPEC §9, the
   repository API in `lib/db/index.ts`, the memory adapter, `scripts/seed.ts`, committed
   `seed/*.json` at the counts in SPEC §9. Unit tests for cart totals, promo rules, and
   order number generation.
2. **Auth.** Auth.js v5 credentials provider per SPEC §10, `jwt` and `session` callbacks,
   `session.store` nullable, `middleware.ts` guards, `/sign-in` page, shared demo password
   from env. Unit test the callbacks.
3. **Storefront.** Routes 1–10 of SPEC §3 with every control in SPEC §4, anonymous cookie
   cart merging at sign-in, guest checkout, Server Actions for all storefront mutations,
   `/promo/[code]` auto-apply, confirmation page. First Playwright smoke: anonymous
   browse → add to cart → guest checkout → confirmation.
4. **Account.** Routes 11–13, profile save, addresses, reorder, refund request.
5. **Admin.** Routes 14–25: dashboard KPIs from seed orders, products CRUD with draft /
   publish / archive, orders with status filter, date range, CSV export route handler,
   fulfill / refund / notes, customers, promos, settings sections, and the
   `merchant-analytics` OpenFeature flag with `pro` stores evaluating on. Smoke: merchant
   sign-in → new product → publish → open order → fulfill.
6. **Chat.** `components/chat/*`, `useChat`, `app/api/chat/route.ts` streaming, persona
   from layout, `lib/chat/` with prompts, tools, and the provider that uses
   `@anthropic-ai/sdk` when `ANTHROPIC_API_KEY` is set and scripted replies otherwise.
   Ratings endpoint. Smoke: open panel, send a suggestion, rate the reply.
7. **Analytics wrapper.** `lib/analytics.ts` and the three call sites from SPEC §5. Nothing
   else is instrumented.
8. **Traffic bot.** `e2e/traffic/` scenarios, visitor and store rotation, pacing, entry
   points, viewports, and percentages exactly as SPEC §12. A `.github/workflows/traffic.yml`
   cron plus `workflow_dispatch` with a `sessions` input. `source: "bot"` on bot-created
   records and the nightly archive job. Dry-run the bot locally against `pnpm dev` with
   `sessions=3` and quote the result.
9. **Deploy readiness.** KV adapter behind `KV_REST_API_URL`, `vercel.json` if needed,
   `README.md` with local setup, env table, deploy steps, and how to run the bot. Final
   full gate run. Stop and report.

## Reporting

At the end of each milestone, write a short summary into `PROGRESS.md`: what shipped,
gate output, open questions. When all nine milestones are done, stop and list the manual
steps left for a human: create the GitHub repo and push, create the Vercel project and set
env, create the Upstash database, enable the Actions cron.

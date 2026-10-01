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

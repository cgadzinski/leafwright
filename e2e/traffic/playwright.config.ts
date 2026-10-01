import { defineConfig } from "@playwright/test";

// Fixed once here so every worker builds the same session plan.
process.env.TRAFFIC_SEED ??= `${new Date().toISOString().slice(0, 13)}-${process.env.GITHUB_RUN_ID ?? "local"}`;

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  testMatch: /traffic\.spec\.ts/,
  fullyParallel: true,
  workers: Number(process.env.TRAFFIC_WORKERS ?? "4"),
  retries: 0,
  timeout: 240_000,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  outputDir: "../../test-results/traffic",
  use: {
    baseURL,
    // Tracing is started per session so only failed sessions keep a trace.
    trace: "off",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
});

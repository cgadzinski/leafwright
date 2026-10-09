import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAnthropicClient } from "./provider";

describe("createAnthropicClient", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    return () => vi.unstubAllEnvs();
  });

  it("names the workspace on every request when a workspace id is set", async () => {
    const client = createAnthropicClient("wrkspc_123");
    const request = await client.buildRequest({ method: "post", path: "/v1/messages" });
    expect(new Headers(request.req.headers).get("anthropic-workspace-id")).toBe("wrkspc_123");
  });

  it("sends no workspace header for workspace-scoped keys", async () => {
    const client = createAnthropicClient("");
    const request = await client.buildRequest({ method: "post", path: "/v1/messages" });
    expect(new Headers(request.req.headers).has("anthropic-workspace-id")).toBe(false);
  });
});

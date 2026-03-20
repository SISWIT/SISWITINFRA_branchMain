import { describe, it, expect } from "vitest";

describe("Configuration Smoke Test", () => {
  it("should have correctly configured path aliases", async () => {
    const { queryClient } = await import("@/core/utils/cache");
    expect(queryClient).toBeDefined();
  });
});

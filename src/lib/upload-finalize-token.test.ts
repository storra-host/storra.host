import { beforeEach, describe, expect, it, vi } from "vitest";

describe("upload finalize token", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.R2_ACCESS_KEY_ID = "test";
    process.env.R2_SECRET_ACCESS_KEY = "test";
    process.env.R2_BUCKET_NAME = "test";
    process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
  });

  it("issues and verifies a valid token", async () => {
    const { issueFinalizeToken, verifyFinalizeToken } = await import("./upload-finalize-token");
    const token = issueFinalizeToken("abc123", "obj/abc123");
    const payload = verifyFinalizeToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.fileId).toBe("abc123");
    expect(payload?.storageKey).toBe("obj/abc123");
  });

  it("rejects tampered token payload", async () => {
    const { issueFinalizeToken, verifyFinalizeToken } = await import("./upload-finalize-token");
    const token = issueFinalizeToken("abc123", "obj/abc123");
    const [payload, sig] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ fileId: "other", storageKey: "obj/abc123", exp: 9999999999, v: 1 }),
      "utf-8"
    ).toString("base64url");
    expect(verifyFinalizeToken(`${tamperedPayload}.${sig}`)).toBeNull();
    expect(verifyFinalizeToken(`${payload}.invalid`)).toBeNull();
  });
});

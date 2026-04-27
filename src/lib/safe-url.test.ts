import { describe, expect, it } from "vitest";
import { sanitizeExternalHttpsUrl } from "./safe-url";

describe("sanitizeExternalHttpsUrl", () => {
  it("accepts https urls", () => {
    expect(sanitizeExternalHttpsUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("rejects non-https urls", () => {
    expect(sanitizeExternalHttpsUrl("http://example.com")).toBeNull();
    expect(sanitizeExternalHttpsUrl("javascript:alert(1)")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(sanitizeExternalHttpsUrl("not-a-url")).toBeNull();
    expect(sanitizeExternalHttpsUrl("")).toBeNull();
    expect(sanitizeExternalHttpsUrl(undefined)).toBeNull();
  });
});

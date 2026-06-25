import { describe, expect, it } from "vitest";
import { appendE2eeKeyToUrl, fileSharePath, getKeyFromHash, shareUrlHasE2eeKey } from "./e2ee-url";

const KEY = "S86Lw3iUHymTtRkd3XnkLg79ExlcShzOOZH7KFtujr8";

describe("e2ee-url", () => {
  it("builds short path shares", () => {
    expect(fileSharePath("abc123")).toBe("/f/abc123");
  });

  it("appends raw key fragment", () => {
    expect(appendE2eeKeyToUrl("https://storra.host/f/id1", KEY)).toBe(
      `https://storra.host/f/id1#${KEY}`
    );
  });

  it("reads raw and legacy hash keys", () => {
    expect(getKeyFromHash(`#${KEY}`)).toBe(KEY);
    expect(getKeyFromHash(`#k=${KEY}`)).toBe(KEY);
  });

  it("detects e2ee in share urls", () => {
    expect(shareUrlHasE2eeKey(`https://storra.host/f/x#${KEY}`)).toBe(true);
    expect(shareUrlHasE2eeKey("https://storra.host/f/x")).toBe(false);
  });
});

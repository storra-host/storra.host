/** base64url key material in the URL fragment (32-byte AES keys → 43 chars). */
const RAW_KEY_RE = /^[A-Za-z0-9_-]{20,88}$/;

export function fileSharePath(fileId: string): string {
  return `/f/${fileId}`;
}

/** Append E2EE key to a share URL (`#<base64url>` - not sent to the server). */
export function appendE2eeKeyToUrl(url: string, dataKey: string | null | undefined): string {
  if (!dataKey?.trim()) return url;
  const k = dataKey.trim();
  if (!RAW_KEY_RE.test(k)) return `${url}#k=${encodeURIComponent(k)}`;
  return `${url}#${k}`;
}

/** Read decryption key from `location.hash` (supports `#key` and legacy `#k=key`). */
export function getKeyFromHash(hash?: string | null): string | null {
  if (typeof window !== "undefined" && hash === undefined) {
    hash = window.location.hash;
  }
  const h = (hash ?? "").startsWith("#") ? (hash ?? "").slice(1) : (hash ?? "");
  if (!h) return null;

  if (h.startsWith("k=")) {
    const k = new URLSearchParams(h).get("k")?.trim() ?? "";
    return k.length > 0 ? k : null;
  }

  if (RAW_KEY_RE.test(h)) return h;

  const legacy = new URLSearchParams(h).get("k")?.trim() ?? "";
  return legacy.length > 0 ? legacy : null;
}

export function shareUrlHasE2eeKey(url: string): boolean {
  const i = url.indexOf("#");
  if (i < 0) return false;
  return getKeyFromHash(url.slice(i)) !== null;
}

export function sanitizeExternalHttpsUrl(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

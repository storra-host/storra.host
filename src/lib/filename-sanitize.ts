export function sanitizeOriginalFilename(
  name: string | null | undefined,
  fallback: string
): string {
  const s = (name ?? "").replace(/\0/g, "").replace(/[/\\?%*:|"<>]/g, "_").trim();
  const base = s.split(/[/\\]/).pop() ?? s;
  const cut = base.slice(0, 200);
  return cut.length > 0 ? cut : fallback;
}

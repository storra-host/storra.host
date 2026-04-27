import pkg from "../../package.json";

function shortRef(sha: string | undefined | null): string {
  if (!sha?.trim()) return "";
  const s = sha.trim();
  if (/^[0-9a-f]{7,40}$/i.test(s)) return s.length > 7 ? s.slice(0, 7) : s;
  return s;
}

export function getAppVersionLabel(): string {
  const v = pkg.version;
  const fromEnv =
    process.env.GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.STORRA_GIT_COMMIT?.trim();
  const ref = shortRef(fromEnv) || "unknown";
  return `${v} · ${ref}`;
}

import { getEnv } from "./env";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { createHash } from "node:crypto";

type LimitKind = "upload" | "fileRead" | "bug";

const limiterCache: Partial<Record<LimitKind, RateLimiterMemory>> = {};

function pointsForKind(kind: LimitKind, e: ReturnType<typeof getEnv>): number {
  const base = e.RATE_MAX_POINTS;
  switch (kind) {
    case "upload":
      return Math.max(base, 200);
    case "fileRead":
      return Math.max(base, 400);
    case "bug":
      return Math.max(20, Math.min(120, base));
    default:
      return base;
  }
}

function getLimiter(kind: LimitKind): RateLimiterMemory {
  if (!limiterCache[kind]) {
    const e = getEnv();
    const sec = Math.max(1, Math.floor(e.RATE_WINDOW_MS / 1000));
    const points = pointsForKind(kind, e);
    limiterCache[kind] = new RateLimiterMemory({
      points,
      duration: sec,
    });
  }
  return limiterCache[kind]!;
}

type LimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

export async function checkRateLimit(
  kind: LimitKind,
  key: string
): Promise<LimitResult> {
  const env = getEnv();
  if (process.env.NODE_ENV === "development") {
    return { allowed: true };
  }
  if (env.RATE_LIMIT_DISABLED) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfter: 60 };
    }
    return { allowed: true };
  }
  try {
    await getLimiter(kind).consume(key, 1);
    return { allowed: true };
  } catch (err) {
    const rej = err as { msBeforeNext?: number };
    const ms = rej.msBeforeNext ?? 1000;
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(ms / 1000)) };
  }
}

export function getClientKey(request: Request) {
  const env = getEnv();
  const h = request.headers;
  if (env.TRUST_PROXY_HEADERS) {
    const cf = h.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
    const vercel = h.get("x-vercel-forwarded-for")?.trim();
    if (vercel) return vercel.split(",")[0]!.trim();
    const xf = h.get("x-forwarded-for");
    if (xf) {
      return xf.split(",")[0]!.trim();
    }
    const realIp = h.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }
  const fingerprint = [
    h.get("user-agent") ?? "",
    h.get("accept-language") ?? "",
    h.get("sec-ch-ua-platform") ?? "",
    h.get("sec-ch-ua") ?? "",
  ].join("|");
  const digest = createHash("sha256").update(fingerprint).digest("base64url");
  return `fp:${digest.slice(0, 24)}`;
}

import { getAppVersionLabel } from "@/lib/build-info";
import { getEnv } from "@/lib/env";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  summary: z
    .string()
    .max(140)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { error: "Summary required" }),
  details: z
    .string()
    .max(4000)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { error: "Details required" }),
  severity: z.enum(["low", "medium", "high"]),
  contactEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().email().max(320).optional()
  ),
  pageUrl: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().url().max(2048).optional()
  ),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const SEVERITY_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Low - cosmetic / typo",
  medium: "Medium - something broken",
  high: "High - can’t use the site",
};

const DISCORD_DESCRIPTION_MAX = 4096;
const DISCORD_FIELD_MAX = 1024;

function escFences(s: string): string {
  return s.replace(/```/g, "'''");
}

function orNotFilled(s: string | undefined | null): string {
  const t = (s ?? "").trim();
  return t.length > 0 ? t : "NOT FILLED";
}

function sanitizePageUrl(pageUrl: string | undefined): string | undefined {
  if (!pageUrl) return undefined;
  try {
    const u = new URL(pageUrl);
    // Defense in depth: never forward fragments (E2EE key material can be in #k=...).
    u.hash = "";
    return u.toString();
  } catch {
    return undefined;
  }
}

function copyBlock(value: string, maxTotal = DISCORD_FIELD_MAX): string {
  const safe = escFences(value);
  const innerMax = maxTotal - 8;
  const t =
    safe.length > innerMax ? safe.slice(0, innerMax - 1) + "…" : safe;
  return `\`\`\`\n${t}\n\`\`\``;
}

function buildDescription(summary: string, details: string): string {
  const esc = escFences;
  const make = (sum: string, det: string) =>
    `**Short summary**\n\`\`\`\n${esc(sum)}\n\`\`\`\n\n` +
    `**What happened**\n\`\`\`\n${esc(det)}\n\`\`\``;
  const foot =
    "\n\n_…trimmed to stay within the Discord 4096 character limit._";
  let s = summary;
  let d = details;
  if (make(s, d).length <= DISCORD_DESCRIPTION_MAX) {
    return make(s, d);
  }
  let note = false;
  while (d.length > 0 && make(s, d).length + foot.length > DISCORD_DESCRIPTION_MAX) {
    d = d.slice(0, -1);
    note = true;
  }
  while (s.length > 0 && make(s, d).length + foot.length > DISCORD_DESCRIPTION_MAX) {
    s = s.slice(0, -1);
    note = true;
  }
  let out = make(s, d);
  if (out.length > DISCORD_DESCRIPTION_MAX) {
    out = out.slice(0, DISCORD_DESCRIPTION_MAX);
  }
  return out + (note ? foot : "");
}

export async function POST(request: Request) {
  const key = getClientKey(request);
  const rl = await checkRateLimit("bug", key);
  if (!rl.allowed) {
    return jsonError(429, "rate_limited", "Too many requests");
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw: unknown = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(
        400,
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid body"
      );
    }
    body = parsed.data;
  } catch {
    return jsonError(400, "bad_request", "Expected JSON body");
  }

  const webhook = getEnv().DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return jsonError(501, "not_configured", "Bug reports are not enabled");
  }

  const ua = request.headers.get("user-agent");
  const pageStr = orNotFilled(sanitizePageUrl(body.pageUrl));
  const contactStr = orNotFilled(body.contactEmail);
  const uaStr = orNotFilled(ua);

  const description = buildDescription(body.summary, body.details);

  const versionStr = getAppVersionLabel();
  const fields: { name: string; value: string }[] = [
    { name: "App version (git)", value: copyBlock(versionStr) },
    { name: "Impact", value: copyBlock(SEVERITY_LABEL[body.severity]) },
    { name: "Page", value: copyBlock(pageStr) },
    { name: "Contact", value: copyBlock(contactStr) },
    { name: "User-Agent", value: copyBlock(uaStr) },
  ];

  const payload = {
    embeds: [
      {
        title: "storra · bug report",
        color: 0xed_42_4c,
        description,
        fields,
      },
    ],
  };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return jsonError(502, "discord_error", "Could not forward report");
  }

  return NextResponse.json({ ok: true as const });
}

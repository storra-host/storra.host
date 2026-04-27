import { z } from "zod";
import { DEFAULT_MAX_FILE_SIZE_BYTES } from "./file-limits";

const serverSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url().optional(),
  R2_REGION: z.preprocess(
    (v) => (typeof v === "string" && v.length > 0 ? v : "auto"),
    z.string()
  ),
  R2_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  ENCRYPTION_KEY: z.string().min(1),
  UPLOAD_FINALIZE_SECRET: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().min(32).optional()
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MAX_FILE_SIZE_BYTES: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : DEFAULT_MAX_FILE_SIZE_BYTES))
    .pipe(z.number().min(1).max(5_000_000_000)),
  RATE_WINDOW_MS: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 120_000)),
  RATE_MAX_POINTS: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 200)),
  RATE_LIMIT_DISABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  TRUST_PROXY_HEADERS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  ALLOW_INSECURE_LOCAL_CRON: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().url().optional()
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().min(1).optional()
  ),
  CRON_SECRET: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().min(1).optional()
  ),
  DISCORD_WEBHOOK_URL: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().url().optional()
  ),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

function resolveR2Endpoint(e: z.infer<typeof serverSchema>): string {
  if (e.R2_ENDPOINT) return e.R2_ENDPOINT;
  if (e.R2_ACCOUNT_ID) {
    return `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  throw new Error(
    "Set R2_ENDPOINT to https://<accountid>.r2.cloudflarestorage.com (or R2_ACCOUNT_ID for the same host pattern)"
  );
}

export function getR2Config() {
  const e = getEnv();
  return {
    region: e.R2_REGION,
    endpoint: resolveR2Endpoint(e),
    bucket: e.R2_BUCKET_NAME,
    credentials: {
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: e.R2_FORCE_PATH_STYLE === true,
  };
}

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  const data = parsed.data;
  resolveR2Endpoint(data);
  cached = data;
  return data;
}

export function getPublicAppUrl(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (request) {
    const u = new URL(request.url);
    return `${u.protocol}//${u.host}`;
  }
  return "http://localhost:3000";
}

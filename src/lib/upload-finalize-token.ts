import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

type FinalizeTokenPayload = {
  fileId: string;
  storageKey: string;
  exp: number;
  v: 1;
};

const TOKEN_TTL_SECONDS = 15 * 60;

function getTokenSecret(): string {
  const env = getEnv();
  return env.UPLOAD_FINALIZE_SECRET ?? `upload-finalize:${env.ENCRYPTION_KEY}`;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getTokenSecret()).update(encodedPayload).digest("base64url");
}

export function issueFinalizeToken(fileId: string, storageKey: string): string {
  const payload: FinalizeTokenPayload = {
    fileId,
    storageKey,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    v: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyFinalizeToken(token: string): FinalizeTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  const sigBuf = Buffer.from(signature, "utf-8");
  const expBuf = Buffer.from(expected, "utf-8");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  let payload: FinalizeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as FinalizeTokenPayload;
  } catch {
    return null;
  }
  if (payload.v !== 1) return null;
  if (!payload.fileId || !payload.storageKey) return null;
  if (!Number.isFinite(payload.exp)) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

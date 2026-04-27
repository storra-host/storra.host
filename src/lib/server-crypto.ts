import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "./env";

const ALG = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let _key: Buffer | null = null;

export function getEncryptionKey(): Buffer {
  if (_key) return _key;
  const e = getEnv();
  const raw = e.ENCRYPTION_KEY.trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    _key = Buffer.from(raw, "hex");
  } else {
    const asB64 = Buffer.from(raw, "base64");
    if (asB64.length === 32) {
      _key = asB64;
    } else {
      const u = Buffer.from(raw, "utf8");
      if (u.length === 32) {
        _key = u;
      } else {
        throw new Error(
          "ENCRYPTION_KEY must be 32 bytes: 64 hex characters, or base64 of 32 bytes, or 32 UTF-8 characters"
        );
      }
    }
  }
  if (_key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must resolve to exactly 32 bytes for AES-256");
  }
  return _key;
}

export function randomIvBuffer(): Buffer {
  return randomBytes(IV_LENGTH);
}

export function ivToRecord(iv: Buffer): string {
  return iv.toString("base64url");
}

export function ivFromRecord(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function encryptBuffer(plain: Buffer, key: Buffer = getEncryptionKey()): {
  iv: Buffer;
  payload: Buffer;
} {
  const iv = randomIvBuffer();
  const c = createCipheriv(ALG, key, iv);
  const part = Buffer.concat([c.update(plain), c.final()]);
  const tag = c.getAuthTag();
  return { iv, payload: Buffer.concat([part, tag]) };
}

/** Wraps a 32-byte per-file data key for storage (server-only decrypt to download). */
export function wrapDataKey(
  dataKey: Buffer,
  master: Buffer = getEncryptionKey()
): string {
  if (dataKey.length !== 32) {
    throw new Error("data key must be 32 bytes");
  }
  const { iv, payload } = encryptBuffer(dataKey, master);
  return Buffer.concat([iv, payload]).toString("base64url");
}

export function unwrapDataKey(
  wrapped: string,
  master: Buffer = getEncryptionKey()
): Buffer {
  const buf = Buffer.from(wrapped, "base64url");
  if (buf.length < IV_LENGTH + 1) {
    throw new Error("invalid wrapped file key");
  }
  const wiv = buf.subarray(0, IV_LENGTH);
  const enc = buf.subarray(IV_LENGTH);
  return decryptBuffer(enc, ivToRecord(wiv), master);
}

export function getFileDecryptionKey(wrappedDataKey: string | null | undefined): Buffer {
  if (wrappedDataKey == null || wrappedDataKey === "") {
    return getEncryptionKey();
  }
  return unwrapDataKey(wrappedDataKey);
}

export function decryptBuffer(
  payload: Buffer,
  ivRecord: string,
  key: Buffer = getEncryptionKey()
): Buffer {
  if (payload.length < AUTH_TAG_LENGTH) {
    throw new Error("ciphertext too short");
  }
  const iv = ivFromRecord(ivRecord);
  if (iv.length !== IV_LENGTH) {
    throw new Error("invalid IV length");
  }
  const tag = payload.subarray(payload.length - AUTH_TAG_LENGTH);
  const enc = payload.subarray(0, payload.length - AUTH_TAG_LENGTH);
  const d = createDecipheriv(ALG, key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]);
}

export { IV_LENGTH, AUTH_TAG_LENGTH, ALG };

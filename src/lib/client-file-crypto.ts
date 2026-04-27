/**
 * Browser AES-256-GCM, matching Node's encryptBuffer in server-crypto.ts
 * (ciphertext with auth tag appended, 12-byte IV, tag 16 bytes).
 */
const TAG_LEN_BYTES = 16;

function base64urlToBytes(s: string): Uint8Array {
  const pad = 4 - (s.length % 4);
  const b64 = (pad === 4 ? s : s + "=".repeat(pad))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generateDataKeyAndIv(): { dataKey: string; iv: string } {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return {
    dataKey: bytesToBase64url(key),
    iv: bytesToBase64url(iv),
  };
}

export function encryptFileWithDataKey(
  fileBytes: ArrayBuffer,
  dataKeyB64url: string,
  ivB64url: string
): Promise<ArrayBuffer> {
  const dataKeyRaw = base64urlToBytes(dataKeyB64url);
  if (dataKeyRaw.length !== 32) {
    return Promise.reject(new Error("Invalid data key length"));
  }
  const ivRaw = base64urlToBytes(ivB64url);
  if (ivRaw.length !== 12) {
    return Promise.reject(new Error("Invalid IV length"));
  }
  const keyBytes = new Uint8Array(32);
  keyBytes.set(dataKeyRaw);
  const iv = new Uint8Array(12);
  iv.set(ivRaw);
  return crypto.subtle
    .importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, [
      "encrypt",
    ])
    .then((key) =>
      crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        fileBytes
      )
    );
}

export function decryptFileWithDataKey(
  encryptedBytes: ArrayBuffer,
  dataKeyB64url: string,
  ivB64url: string
): Promise<ArrayBuffer> {
  const dataKeyRaw = base64urlToBytes(dataKeyB64url);
  if (dataKeyRaw.length !== 32) {
    return Promise.reject(new Error("Invalid data key length"));
  }
  const ivRaw = base64urlToBytes(ivB64url);
  if (ivRaw.length !== 12) {
    return Promise.reject(new Error("Invalid IV length"));
  }
  if (encryptedBytes.byteLength < TAG_LEN_BYTES) {
    return Promise.reject(new Error("Ciphertext too short"));
  }
  const keyBytes = new Uint8Array(32);
  keyBytes.set(dataKeyRaw);
  const iv = new Uint8Array(12);
  iv.set(ivRaw);
  return crypto.subtle
    .importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, [
      "decrypt",
    ])
    .then((key) =>
      crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        encryptedBytes
      )
    );
}

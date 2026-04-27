/** 500 MiB (500 × 1024² bytes). Used when `MAX_FILE_SIZE_BYTES` is unset. */
export const DEFAULT_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/**
 * Resolves the max upload size for UI and client checks.
 * Server enforcement uses `getEnv().MAX_FILE_SIZE_BYTES` (same default when env is empty).
 */
export function getMaxFileSizeBytes(): number {
  const v = process.env.MAX_FILE_SIZE_BYTES;
  if (v) {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_MAX_FILE_SIZE_BYTES;
}

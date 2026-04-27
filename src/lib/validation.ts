import { z } from "zod";

export const uploadMetadataSchema = z.object({
  encryptionMode: z
    .enum(["legacy_server", "e2ee_client"])
    .optional()
    .default("e2ee_client"),
  iv: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16}$/)
    .optional(),
  originalName: z.string().max(500).optional(),
  mimeType: z.string().max(200).optional().nullable(),
  expiresAt: z
    .union([z.string().datetime(), z.null()])
    .optional(),
  maxDownloads: z
    .number()
    .int()
    .min(1)
    .max(1_000_000)
    .optional()
    .nullable(),
  accessPassword: z.preprocess((v) => {
    if (v == null || v === "") return undefined;
    if (typeof v !== "string") return v;
    const t = v.trim();
    return t.length === 0 ? undefined : t;
  }, z.string().min(4).max(200).optional()),
});

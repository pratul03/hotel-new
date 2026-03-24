import { z } from "zod";

export const invoiceTypeSchema = z.enum([
  "order",
  "payment",
  "refund",
  "revoke",
  "other",
]);

export const createInvoiceSchema = z.object({
  type: invoiceTypeSchema,
  title: z.string().trim().min(3).max(160),
  bookingId: z.string().trim().min(1).optional(),
  paymentId: z.string().trim().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().trim().length(3).optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(2).max(240),
        amount: z.number().positive(),
      }),
    )
    .optional(),
  metadata: z.object({}).catchall(z.unknown()).optional(),
});

export const listFilterSchema = z.object({
  type: invoiceTypeSchema.optional(),
  status: z.enum(["issued", "revoked"]).optional(),
});

export const accessUrlSchema = z.object({
  expiresIn: z.coerce.number().int().min(60).max(86400).optional(),
});

export const storageAuditSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  olderThanDays: z.coerce.number().int().min(0).max(3650).optional(),
  repairMissing: z.coerce.boolean().optional(),
  dryRun: z.coerce.boolean().optional(),
});

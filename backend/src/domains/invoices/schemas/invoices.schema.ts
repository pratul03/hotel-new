import { z, v } from "../../../utils/validation";

export const invoiceTypeSchema = z.enum([
  "order",
  "payment",
  "refund",
  "revoke",
  "other",
]);

export const createInvoiceSchema = z.object({
  type: invoiceTypeSchema,
  title: v.text(3, 160),
  bookingId: v.id().optional(),
  paymentId: v.id().optional(),
  amount: v.positiveNumber().optional(),
  currency: z.coerce.string().trim().length(3).optional(),
  lineItems: z
    .array(
      z.object({
        description: v.text(2, 240),
        amount: v.positiveNumber(),
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
  expiresIn: v.int(60, 86400).optional(),
});

export const storageAuditSchema = z.object({
  limit: v.int(1, 500).optional(),
  olderThanDays: v.int(0, 3650).optional(),
  repairMissing: v.bool().optional(),
  dryRun: v.bool().optional(),
});

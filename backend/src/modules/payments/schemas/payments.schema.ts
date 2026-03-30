import { z, v } from "../../../utils/validation";

export const createPaymentSchema = z.object({
  bookingId: v.id(),
});

export const createChargebackSchema = z.object({
  paymentId: v.id(),
  reason: v.text(5),
  evidenceUrls: z
    .array(v.url())
    .optional(),
});

export const updateChargebackSchema = z.object({
  status: z.enum([
    "submitted",
    "under_review",
    "evidence_requested",
    "resolved_won",
    "resolved_lost",
  ]),
  note: v.text(2).optional(),
});

export const fxRateSchema = z.object({
  baseCurrency: z.coerce.string().trim().length(3),
  quoteCurrency: z.coerce.string().trim().length(3),
  rate: v.positiveNumber(),
  provider: v.text(2, 100).optional(),
});

export const reprocessStaleSchema = z.object({
  olderThanMinutes: v.int(1, 180).optional(),
  limit: v.int(1, 500).optional(),
  dryRun: v.bool().optional(),
});

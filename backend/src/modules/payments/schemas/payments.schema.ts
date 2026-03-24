import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
});

export const createChargebackSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().min(5),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const updateChargebackSchema = z.object({
  status: z.enum([
    "submitted",
    "under_review",
    "evidence_requested",
    "resolved_won",
    "resolved_lost",
  ]),
  note: z.string().min(2).optional(),
});

export const fxRateSchema = z.object({
  baseCurrency: z.string().trim().length(3),
  quoteCurrency: z.string().trim().length(3),
  rate: z.number().positive(),
  provider: z.string().trim().min(2).max(100).optional(),
});

export const reprocessStaleSchema = z.object({
  olderThanMinutes: z.coerce.number().int().min(1).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  dryRun: z.coerce.boolean().optional(),
});

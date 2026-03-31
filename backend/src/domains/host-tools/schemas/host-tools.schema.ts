import { z, v } from "../../../utils/validation";

export const cancellationSchema = z.object({
  policyType: z.enum(["flexible", "moderate", "strict"]),
  freeCancellationHours: z.coerce
    .number()
    .int()
    .min(0)
    .max(30 * 24),
  partialRefundPercent: v.int(0, 100),
  noShowPenaltyPercent: v.int(0, 100),
});

export const quickReplySchema = z.object({
  title: v.text(2, 150),
  content: v.text(2),
  category: v.trimmed(50).optional(),
});

export const scheduledMessageSchema = z.object({
  receiverUserId: v.id(),
  bookingId: v.id().optional(),
  content: v.id(),
  sendAt: v.isoDateTime(),
});

export const addCohostSchema = z.object({
  cohostUserId: v.id(),
  permissions: z
    .array(
      z.enum([
        "calendar",
        "messaging",
        "reservations",
        "pricing",
        "cleaning",
        "reviews",
      ]),
    )
    .min(1)
    .optional(),
  revenueSplitPercent: v.int(0, 100).optional(),
});

export const complianceSchema = z.object({
  jurisdictionCode: v.text(2, 120),
  checklistItems: z.array(
    z.object({
      label: v.id(),
      completed: v.bool(),
    }),
  ),
  status: z.enum(["incomplete", "in_review", "completed"]).optional(),
});

export const claimSchema = z.object({
  hotelId: v.id(),
  bookingId: v.id(),
  title: v.text(3, 255),
  description: v.text(5),
  amountClaimed: v.number(0).optional(),
  evidenceUrls: z.array(v.url()).optional(),
});

export const adjudicateClaimSchema = z.object({
  status: z.enum(["reviewing", "approved", "rejected", "settled"]),
  resolutionNote: v.text(2).optional(),
});

export const listingQualitySchema = z.object({
  coverImageUrl: v.url().optional(),
  guidebook: v.trimmed().optional(),
  houseManual: v.trimmed().optional(),
  checkInSteps: v.trimmed().optional(),
});

export const analyticsQuerySchema = z.object({
  days: v.int(1, 365).optional(),
});

export const auditExportQuerySchema = z.object({
  days: v.int(1, 365).optional(),
});

export const hosttoolsSchemas = {
  cancellationSchema,
  quickReplySchema,
  scheduledMessageSchema,
  addCohostSchema,
  complianceSchema,
  claimSchema,
  adjudicateClaimSchema,
  listingQualitySchema,
  analyticsQuerySchema,
  auditExportQuerySchema,
};

export default hosttoolsSchemas;

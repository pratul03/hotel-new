"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hosttoolsSchemas = exports.auditExportQuerySchema = exports.analyticsQuerySchema = exports.listingQualitySchema = exports.adjudicateClaimSchema = exports.claimSchema = exports.complianceSchema = exports.addCohostSchema = exports.scheduledMessageSchema = exports.quickReplySchema = exports.cancellationSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.cancellationSchema = validation_1.z.object({
    policyType: validation_1.z.enum(["flexible", "moderate", "strict"]),
    freeCancellationHours: validation_1.z.coerce
        .number()
        .int()
        .min(0)
        .max(30 * 24),
    partialRefundPercent: validation_1.v.int(0, 100),
    noShowPenaltyPercent: validation_1.v.int(0, 100),
});
exports.quickReplySchema = validation_1.z.object({
    title: validation_1.v.text(2, 150),
    content: validation_1.v.text(2),
    category: validation_1.v.trimmed(50).optional(),
});
exports.scheduledMessageSchema = validation_1.z.object({
    receiverUserId: validation_1.v.id(),
    bookingId: validation_1.v.id().optional(),
    content: validation_1.v.id(),
    sendAt: validation_1.v.isoDateTime(),
});
exports.addCohostSchema = validation_1.z.object({
    cohostUserId: validation_1.v.id(),
    permissions: validation_1.z
        .array(validation_1.z.enum([
        "calendar",
        "messaging",
        "reservations",
        "pricing",
        "cleaning",
        "reviews",
    ]))
        .min(1)
        .optional(),
    revenueSplitPercent: validation_1.v.int(0, 100).optional(),
});
exports.complianceSchema = validation_1.z.object({
    jurisdictionCode: validation_1.v.text(2, 120),
    checklistItems: validation_1.z.array(validation_1.z.object({
        label: validation_1.v.id(),
        completed: validation_1.v.bool(),
    })),
    status: validation_1.z.enum(["incomplete", "in_review", "completed"]).optional(),
});
exports.claimSchema = validation_1.z.object({
    hotelId: validation_1.v.id(),
    bookingId: validation_1.v.id(),
    title: validation_1.v.text(3, 255),
    description: validation_1.v.text(5),
    amountClaimed: validation_1.v.number(0).optional(),
    evidenceUrls: validation_1.z.array(validation_1.v.url()).optional(),
});
exports.adjudicateClaimSchema = validation_1.z.object({
    status: validation_1.z.enum(["reviewing", "approved", "rejected", "settled"]),
    resolutionNote: validation_1.v.text(2).optional(),
});
exports.listingQualitySchema = validation_1.z.object({
    coverImageUrl: validation_1.v.url().optional(),
    guidebook: validation_1.v.trimmed().optional(),
    houseManual: validation_1.v.trimmed().optional(),
    checkInSteps: validation_1.v.trimmed().optional(),
});
exports.analyticsQuerySchema = validation_1.z.object({
    days: validation_1.v.int(1, 365).optional(),
});
exports.auditExportQuerySchema = validation_1.z.object({
    days: validation_1.v.int(1, 365).optional(),
});
exports.hosttoolsSchemas = {
    cancellationSchema: exports.cancellationSchema,
    quickReplySchema: exports.quickReplySchema,
    scheduledMessageSchema: exports.scheduledMessageSchema,
    addCohostSchema: exports.addCohostSchema,
    complianceSchema: exports.complianceSchema,
    claimSchema: exports.claimSchema,
    adjudicateClaimSchema: exports.adjudicateClaimSchema,
    listingQualitySchema: exports.listingQualitySchema,
    analyticsQuerySchema: exports.analyticsQuerySchema,
    auditExportQuerySchema: exports.auditExportQuerySchema,
};
exports.default = exports.hosttoolsSchemas;

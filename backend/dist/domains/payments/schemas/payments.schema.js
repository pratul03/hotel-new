"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reprocessStaleSchema = exports.fxRateSchema = exports.updateChargebackSchema = exports.createChargebackSchema = exports.verifyPaymentSchema = exports.createPaymentSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createPaymentSchema = validation_1.z.object({
    bookingId: validation_1.v.id(),
});
exports.verifyPaymentSchema = validation_1.z.object({
    bookingId: validation_1.v.id(),
    razorpayOrderId: validation_1.v.text(3),
    razorpayPaymentId: validation_1.v.text(3),
    razorpaySignature: validation_1.v.text(3),
});
exports.createChargebackSchema = validation_1.z.object({
    paymentId: validation_1.v.id(),
    reason: validation_1.v.text(5),
    evidenceUrls: validation_1.z.array(validation_1.v.url()).optional(),
});
exports.updateChargebackSchema = validation_1.z.object({
    status: validation_1.z.enum([
        "submitted",
        "under_review",
        "evidence_requested",
        "resolved_won",
        "resolved_lost",
    ]),
    note: validation_1.v.text(2).optional(),
});
exports.fxRateSchema = validation_1.z.object({
    baseCurrency: validation_1.z.coerce.string().trim().length(3),
    quoteCurrency: validation_1.z.coerce.string().trim().length(3),
    rate: validation_1.v.positiveNumber(),
    provider: validation_1.v.text(2, 100).optional(),
});
exports.reprocessStaleSchema = validation_1.z.object({
    olderThanMinutes: validation_1.v.int(1, 180).optional(),
    limit: validation_1.v.int(1, 500).optional(),
    dryRun: validation_1.v.bool().optional(),
});

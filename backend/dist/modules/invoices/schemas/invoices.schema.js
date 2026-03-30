"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageAuditSchema = exports.accessUrlSchema = exports.listFilterSchema = exports.createInvoiceSchema = exports.invoiceTypeSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.invoiceTypeSchema = validation_1.z.enum([
    "order",
    "payment",
    "refund",
    "revoke",
    "other",
]);
exports.createInvoiceSchema = validation_1.z.object({
    type: exports.invoiceTypeSchema,
    title: validation_1.v.text(3, 160),
    bookingId: validation_1.v.id().optional(),
    paymentId: validation_1.v.id().optional(),
    amount: validation_1.v.positiveNumber().optional(),
    currency: validation_1.z.coerce.string().trim().length(3).optional(),
    lineItems: validation_1.z
        .array(validation_1.z.object({
        description: validation_1.v.text(2, 240),
        amount: validation_1.v.positiveNumber(),
    }))
        .optional(),
    metadata: validation_1.z.object({}).catchall(validation_1.z.unknown()).optional(),
});
exports.listFilterSchema = validation_1.z.object({
    type: exports.invoiceTypeSchema.optional(),
    status: validation_1.z.enum(["issued", "revoked"]).optional(),
});
exports.accessUrlSchema = validation_1.z.object({
    expiresIn: validation_1.v.int(60, 86400).optional(),
});
exports.storageAuditSchema = validation_1.z.object({
    limit: validation_1.v.int(1, 500).optional(),
    olderThanDays: validation_1.v.int(0, 3650).optional(),
    repairMissing: validation_1.v.bool().optional(),
    dryRun: validation_1.v.bool().optional(),
});

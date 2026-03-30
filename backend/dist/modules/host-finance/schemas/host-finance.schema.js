"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostfinanceSchemas = exports.hostFinanceQuerySchema = exports.payoutRequestSchema = exports.payoutAccountSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.payoutAccountSchema = validation_1.z.object({
    accountHolderName: validation_1.v.text(2, 120),
    bankName: validation_1.v.text(2, 120),
    accountNumber: validation_1.v.text(8, 24),
    ifscCode: validation_1.v.text(8, 20),
    payoutMethod: validation_1.z.enum(["bank_transfer", "upi"]).optional(),
    upiId: validation_1.v.text(3, 120).optional(),
});
exports.payoutRequestSchema = validation_1.z.object({
    amount: validation_1.v.positiveNumber(),
    notes: validation_1.v.trimmed(500).optional(),
});
exports.hostFinanceQuerySchema = validation_1.z.object({
    months: validation_1.v.int(1, 60).optional(),
    limit: validation_1.v.int(1, 200).optional(),
});
exports.hostfinanceSchemas = {
    payoutAccountSchema: exports.payoutAccountSchema,
    payoutRequestSchema: exports.payoutRequestSchema,
    hostFinanceQuerySchema: exports.hostFinanceQuerySchema,
};
exports.default = exports.hostfinanceSchemas;

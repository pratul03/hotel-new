"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsSchemas = exports.offPlatformFeeSchema = exports.statusSchema = exports.resolveSchema = exports.listSchema = exports.createSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createSchema = validation_1.z.object({
    bookingId: validation_1.v.id(),
    description: validation_1.v.text(5),
});
exports.listSchema = validation_1.z.object({
    status: validation_1.z.enum(["open", "investigating", "resolved", "closed"]).optional(),
    bookingId: validation_1.v.id().optional(),
});
exports.resolveSchema = validation_1.z.object({
    resolution: validation_1.v.text(3),
});
exports.statusSchema = validation_1.z.object({
    status: validation_1.z.enum(["open", "investigating", "resolved", "closed"]),
    resolution: validation_1.v.text(3).optional(),
});
exports.offPlatformFeeSchema = validation_1.z.object({
    bookingId: validation_1.v.id(),
    description: validation_1.v.text(5),
    evidenceUrls: validation_1.z
        .array(validation_1.v.url())
        .optional(),
});
exports.reportsSchemas = {
    createSchema: exports.createSchema,
    listSchema: exports.listSchema,
    resolveSchema: exports.resolveSchema,
    statusSchema: exports.statusSchema,
    offPlatformFeeSchema: exports.offPlatformFeeSchema,
};
exports.default = exports.reportsSchemas;

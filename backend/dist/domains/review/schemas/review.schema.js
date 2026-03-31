"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchemas = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createReviewSchema = validation_1.z.object({
    bookingId: validation_1.v.id(),
    receiverId: validation_1.v.id(),
    rating: validation_1.v.int(1, 5),
    comment: validation_1.v.trimmed(2000).optional(),
    categories: validation_1.z.record(validation_1.z.string(), validation_1.z.coerce.number()).optional(),
    hotelId: validation_1.v.id().optional(),
});
exports.updateReviewSchema = validation_1.z.object({
    rating: validation_1.v.int(1, 5).optional(),
    comment: validation_1.v.trimmed(2000).optional(),
    categories: validation_1.z.record(validation_1.z.string(), validation_1.z.coerce.number()).optional(),
});
exports.reviewSchemas = {
    createReviewSchema: exports.createReviewSchema,
    updateReviewSchema: exports.updateReviewSchema,
};
exports.default = exports.reviewSchemas;

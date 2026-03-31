"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewMutationResolvers = void 0;
const database_1 = require("../../../../config/database");
const review_schema_1 = require("../../../../domains/review/schemas/review.schema");
const review_service_1 = require("../../../../domains/review/services/review.service");
const context_1 = require("../../../context");
exports.reviewMutationResolvers = {
    createReview: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = review_schema_1.createReviewSchema.parse(args.input);
        return review_service_1.reviewService.createReview(auth.userId, parsed);
    },
    updateReview: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = review_schema_1.updateReviewSchema.parse(args.input);
        const existing = await database_1.prisma.review.findUnique({
            where: { id: args.reviewId },
        });
        if (!existing || existing.senderId !== auth.userId) {
            throw new Error("Review not found");
        }
        return database_1.prisma.review.update({
            where: { id: args.reviewId },
            data: {
                ...(typeof parsed.rating === "number" && { rating: parsed.rating }),
                ...(typeof parsed.comment === "string" && {
                    comment: parsed.comment,
                }),
                ...(parsed.categories && {
                    categories: JSON.stringify(parsed.categories),
                }),
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
    },
    deleteReview: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const existing = await database_1.prisma.review.findUnique({
            where: { id: args.reviewId },
        });
        if (!existing || existing.senderId !== auth.userId) {
            throw new Error("Review not found");
        }
        await database_1.prisma.review.delete({ where: { id: args.reviewId } });
        return { deleted: true, message: "Review deleted" };
    },
};

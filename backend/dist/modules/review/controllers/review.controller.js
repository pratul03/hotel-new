"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const database_1 = require("../../../config/database");
const utils_1 = require("../../../utils");
const review_queries_1 = require("../queries/review.queries");
const review_schema_1 = require("../schemas/review.schema");
const review_service_1 = require("../services/review.service");
exports.reviewController = {
    getAll: review_service_1.reviewCrud.getAll,
    getOne: review_service_1.reviewCrud.getOne,
    async getByBooking(req, res) {
        const review = await database_1.prisma.review.findFirst({
            where: { bookingId: review_queries_1.reviewQueries.bookingId(req) },
        });
        res.json((0, utils_1.successResponse)(review, "Review fetched for booking"));
    },
    async create(req, res) {
        const payload = review_schema_1.createReviewSchema.parse(req.body);
        const review = await review_service_1.reviewService.createReview(review_queries_1.reviewQueries.userId(req), payload);
        res.status(201).json((0, utils_1.successResponse)(review, "Review submitted"));
    },
    async update(req, res) {
        const id = review_queries_1.reviewQueries.id(req);
        const payload = review_schema_1.updateReviewSchema.parse(req.body);
        const existing = await database_1.prisma.review.findUnique({ where: { id } });
        if (!existing || existing.senderId !== review_queries_1.reviewQueries.userId(req)) {
            res.status(404).json((0, utils_1.successResponse)(null, "Review not found"));
            return;
        }
        const updated = await database_1.prisma.review.update({
            where: { id },
            data: {
                ...(typeof payload.rating === "number" && { rating: payload.rating }),
                ...(typeof payload.comment === "string" && {
                    comment: payload.comment,
                }),
                ...(payload.categories && {
                    categories: JSON.stringify(payload.categories),
                }),
            },
        });
        res.json((0, utils_1.successResponse)(updated, "Review updated"));
    },
    async delete(req, res) {
        const id = review_queries_1.reviewQueries.id(req);
        const existing = await database_1.prisma.review.findUnique({ where: { id } });
        if (!existing || existing.senderId !== review_queries_1.reviewQueries.userId(req)) {
            res.status(404).json((0, utils_1.successResponse)(null, "Review not found"));
            return;
        }
        await database_1.prisma.review.delete({ where: { id } });
        res.json((0, utils_1.successResponse)({ deleted: true }, "Review deleted"));
    },
};
exports.default = exports.reviewController;

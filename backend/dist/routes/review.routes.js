"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const review_service_1 = require("../services/review.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
const createReviewSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
    receiverId: zod_1.z.string().min(1),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().optional(),
    categories: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
    hotelId: zod_1.z.string().optional(),
});
const updateReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5).optional(),
    comment: zod_1.z.string().optional(),
    categories: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.get("/", review_service_1.reviewCrud.getAll);
router.get("/booking/:bookingId", (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.bookingId);
    const review = await database_1.prisma.review.findFirst({ where: { bookingId } });
    res.json((0, utils_1.successResponse)(review, "Review fetched for booking"));
}));
router.get("/:id", review_service_1.reviewCrud.getOne);
router.post("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = createReviewSchema.parse(req.body);
    const review = await review_service_1.reviewService.createReview(req.userId, payload);
    res.status(201).json((0, utils_1.successResponse)(review, "Review submitted"));
}));
router.put("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const payload = updateReviewSchema.parse(req.body);
    const existing = await database_1.prisma.review.findUnique({ where: { id } });
    if (!existing || existing.senderId !== req.userId) {
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
}));
router.delete("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const existing = await database_1.prisma.review.findUnique({ where: { id } });
    if (!existing || existing.senderId !== req.userId) {
        res.status(404).json((0, utils_1.successResponse)(null, "Review not found"));
        return;
    }
    await database_1.prisma.review.delete({ where: { id } });
    res.json((0, utils_1.successResponse)({ deleted: true }, "Review deleted"));
}));
exports.default = router;

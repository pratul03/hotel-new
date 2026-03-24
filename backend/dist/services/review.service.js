"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = exports.reviewCrud = void 0;
const utils_1 = require("../utils");
const database_1 = require("../config/database");
const eventPublisher_1 = require("../utils/eventPublisher");
exports.reviewCrud = (0, utils_1.createCrudHandlers)("review", {
    searchableFields: ["comment"],
    includeOnGetAll: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        booking: { select: { id: true, roomId: true } },
    },
    includeOnGetOne: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        booking: true,
    },
});
exports.reviewService = {
    async createReview(senderId, data) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: data.bookingId },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.userId !== senderId) {
            throw new utils_1.AppError("Only the booking guest can submit review", 403);
        }
        if (booking.status !== "checked_out") {
            throw new utils_1.AppError("Review can only be submitted after check-out", 400);
        }
        const review = await database_1.prisma.review.create({
            data: {
                senderId,
                receiverId: data.receiverId,
                bookingId: data.bookingId,
                rating: data.rating,
                comment: data.comment,
                categories: JSON.stringify(data.categories || {}),
                hotelId: data.hotelId,
            },
        });
        // Fire-and-forget: notify the reviewed user
        Promise.all([
            database_1.prisma.user.findUnique({
                where: { id: senderId },
                select: { id: true, name: true, email: true },
            }),
            database_1.prisma.user.findUnique({
                where: { id: data.receiverId },
                select: { id: true, name: true, email: true },
            }),
        ])
            .then(([sender, receiver]) => {
            if (!sender || !receiver)
                return;
            (0, eventPublisher_1.publishEvent)("review.created", {
                reviewId: review.id,
                sender,
                receiver,
                rating: data.rating,
                comment: data.comment,
                bookingId: data.bookingId,
            });
        })
            .catch(() => { });
        return review;
    },
};
exports.default = exports.reviewService;

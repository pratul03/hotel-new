"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewQueryResolvers = void 0;
const database_1 = require("../../../../config/database");
const context_1 = require("../../../context");
exports.reviewQueryResolvers = {
    reviews: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const where = args.bookingId
            ? { bookingId: args.bookingId }
            : {
                OR: [
                    { senderId: auth.userId },
                    { receiverId: auth.userId },
                    { booking: { userId: auth.userId } },
                ],
            };
        return database_1.prisma.review.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    reviewById: async (_parent, args, context) => {
        (0, context_1.requireAuth)(context);
        return database_1.prisma.review.findUnique({
            where: { id: args.reviewId },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
    },
    reviewByBooking: async (_parent, args, context) => {
        (0, context_1.requireAuth)(context);
        return database_1.prisma.review.findFirst({
            where: { bookingId: args.bookingId },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
    },
};

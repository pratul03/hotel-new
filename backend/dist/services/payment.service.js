"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const razorpay_1 = tslib_1.__importDefault(require("razorpay"));
const database_1 = require("../config/database");
const environment_1 = require("../config/environment");
const utils_1 = require("../utils");
const eventPublisher_1 = require("../utils/eventPublisher");
const razorpay = new razorpay_1.default({
    key_id: environment_1.env.RAZORPAY_KEY_ID,
    key_secret: environment_1.env.RAZORPAY_KEY_SECRET,
});
exports.paymentService = {
    async createOrder(userId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new utils_1.AppError("Booking not found", 404);
        if (booking.userId !== userId)
            throw new utils_1.AppError("Unauthorized", 403);
        const amountInPaise = Math.round(booking.amount * 100);
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: booking.id,
            notes: { bookingId: booking.id },
        });
        const payment = await database_1.prisma.payment.upsert({
            where: { bookingId },
            update: {
                razorpayOrderId: order.id,
                amount: booking.amount,
                status: "processing",
            },
            create: {
                bookingId,
                razorpayOrderId: order.id,
                amount: booking.amount,
                status: "processing",
            },
        });
        return { order, payment };
    },
    async handleWebhook(signature, body) {
        if (!signature)
            throw new utils_1.AppError("Missing webhook signature", 400);
        const expected = crypto_1.default
            .createHmac("sha256", environment_1.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");
        if (expected !== signature) {
            throw new utils_1.AppError("Invalid webhook signature", 400);
        }
        const payload = JSON.parse(body);
        const event = payload.event;
        const entity = payload?.payload?.payment?.entity;
        const orderId = entity?.order_id;
        if (!orderId)
            return { ok: true, ignored: true };
        const payment = await database_1.prisma.payment.findFirst({
            where: { razorpayOrderId: orderId },
        });
        if (!payment)
            return { ok: true, ignored: true };
        if (event === "payment.captured") {
            await database_1.prisma.$transaction([
                database_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        razorpayPaymentId: entity.id,
                        status: "completed",
                    },
                }),
                database_1.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: "confirmed" },
                }),
            ]);
            // Fire-and-forget: notify guest of payment success + booking confirmed
            database_1.prisma.booking
                .findUnique({
                where: { id: payment.bookingId },
                include: {
                    guest: { select: { id: true, name: true, email: true } },
                    room: { include: { hotel: { select: { name: true } } } },
                },
            })
                .then((b) => {
                if (!b)
                    return;
                (0, eventPublisher_1.publishEvent)("payment.success", {
                    bookingId: b.id,
                    paymentId: entity.id,
                    guest: b.guest,
                    amount: payment.amount,
                    hotel: { name: b.room.hotel.name },
                });
                (0, eventPublisher_1.publishEvent)("booking.confirmed", {
                    bookingId: b.id,
                    guest: b.guest,
                    hotel: { name: b.room.hotel.name },
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                    amount: b.amount,
                });
            })
                .catch(() => { });
        }
        if (event === "payment.failed") {
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: { status: "failed" },
            });
            // Fire-and-forget: notify guest of payment failure
            database_1.prisma.booking
                .findUnique({
                where: { id: payment.bookingId },
                include: { guest: { select: { id: true, name: true, email: true } } },
            })
                .then((b) => {
                if (!b)
                    return;
                (0, eventPublisher_1.publishEvent)("payment.failed", {
                    bookingId: b.id,
                    guest: b.guest,
                    amount: payment.amount,
                });
            })
                .catch(() => { });
        }
        return { ok: true };
    },
    async getById(id) {
        const payment = await database_1.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new utils_1.AppError("Payment not found", 404);
        return payment;
    },
    async getByBooking(bookingId) {
        const payment = await database_1.prisma.payment.findUnique({ where: { bookingId } });
        if (!payment)
            throw new utils_1.AppError("Payment not found", 404);
        return payment;
    },
};
exports.default = exports.paymentService;

"use strict";
/**
 * Job: Booking Expiry
 * Schedule: Every 5 minutes
 *
 * Finds PENDING bookings whose expiresAt has passed, marks them EXPIRED,
 * creates a BookingHistory entry, and publishes a booking.expired event.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBookingExpiryJob = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const runBookingExpiryJob = async () => {
    const startedAt = new Date();
    const tracker = (0, types_1.createJobResult)("BookingExpiry", startedAt);
    let processed = 0;
    const errors = [];
    const expiredBookings = await database_1.prisma.booking.findMany({
        where: {
            status: "pending",
            expiresAt: { lte: new Date() },
        },
        include: {
            guest: { select: { id: true, name: true, email: true } },
            room: {
                include: {
                    hotel: {
                        select: { name: true, checkInTime: true, checkOutTime: true },
                    },
                },
            },
        },
    });
    if (!expiredBookings.length) {
        tracker.finalize(0);
        return;
    }
    const publisher = await (0, redis_1.getPublisher)();
    for (const booking of expiredBookings) {
        try {
            await database_1.prisma.$transaction([
                database_1.prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: "expired" },
                }),
                database_1.prisma.bookingHistory.create({
                    data: {
                        bookingId: booking.id,
                        status: "expired",
                        updatedBy: "system",
                        notes: "Auto-expired: payment not completed within 10 minutes",
                    },
                }),
            ]);
            const message = JSON.stringify({
                type: "booking.expired",
                data: {
                    bookingId: booking.id,
                    guest: booking.guest,
                    hotel: { name: booking.room.hotel.name },
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                },
                timestamp: new Date().toISOString(),
            });
            await publisher.publish(types_1.EVENT_CHANNEL, message);
            processed++;
        }
        catch (err) {
            errors.push(`Booking ${booking.id}: ${err.message}`);
            console.error(`[BookingExpiry] Failed for booking ${booking.id}:`, err);
        }
    }
    tracker.finalize(processed, errors.length, errors);
};
exports.runBookingExpiryJob = runBookingExpiryJob;

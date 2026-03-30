"use strict";
/**
 * Job: Check-in & Check-out Reminders
 * Schedule: Every hour
 *
 * Publishes reminders for:
 *   - Confirmed bookings checking in tomorrow (checkin.reminder)
 *   - Checked-in bookings checking out tomorrow (checkout.reminder)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCheckoutReminderJob = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const startOfTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};
const endOfTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
};
const runCheckoutReminderJob = async () => {
    const startedAt = new Date();
    const tracker = (0, types_1.createJobResult)("CheckoutReminder", startedAt);
    const tomorrow = { gte: startOfTomorrow(), lte: endOfTomorrow() };
    let processed = 0;
    const errors = [];
    const publisher = await (0, redis_1.getPublisher)();
    // Check-in reminders: confirmed bookings whose checkIn is tomorrow
    const checkingInTomorrow = await database_1.prisma.booking.findMany({
        where: { status: "confirmed", checkIn: tomorrow },
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
    for (const booking of checkingInTomorrow) {
        try {
            const checkInMessage = JSON.stringify({
                type: "checkin.reminder",
                data: {
                    bookingId: booking.id,
                    guest: booking.guest,
                    hotel: {
                        name: booking.room.hotel.name,
                        checkInTime: booking.room.hotel.checkInTime,
                    },
                    checkIn: booking.checkIn,
                },
                timestamp: new Date().toISOString(),
            });
            await publisher.publish(types_1.EVENT_CHANNEL, checkInMessage);
            processed++;
        }
        catch (err) {
            errors.push(`CheckIn reminder for booking ${booking.id}: ${err.message}`);
        }
    }
    // Check-out reminders: checked-in bookings whose checkOut is tomorrow
    const checkingOutTomorrow = await database_1.prisma.booking.findMany({
        where: { status: "checked_in", checkOut: tomorrow },
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
    for (const booking of checkingOutTomorrow) {
        try {
            const checkOutMessage = JSON.stringify({
                type: "checkout.reminder",
                data: {
                    bookingId: booking.id,
                    guest: booking.guest,
                    hotel: {
                        name: booking.room.hotel.name,
                        checkOutTime: booking.room.hotel.checkOutTime,
                    },
                    checkOut: booking.checkOut,
                },
                timestamp: new Date().toISOString(),
            });
            await publisher.publish(types_1.EVENT_CHANNEL, checkOutMessage);
            processed++;
        }
        catch (err) {
            errors.push(`CheckOut reminder for booking ${booking.id}: ${err.message}`);
        }
    }
    tracker.finalize(processed, errors.length, errors);
};
exports.runCheckoutReminderJob = runCheckoutReminderJob;

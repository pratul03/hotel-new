"use strict";
/**
 * Job: Superhost Status Calculator
 * Schedule: Daily at 2 AM
 *
 * For every host, recalculates their metrics and updates HostVerification.
 * Publishes a superhost.updated event if the status changed.
 *
 * Superhost criteria:
 *   - Average rating >= 4.8
 *   - Response rate >= 90%
 *   - Cancellation rate < 1% (host cancellations)
 *   - Account age >= 1 year
 *   - Minimum 10 completed bookings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSuperhostCalcJob = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const MIN_RATING = 4.8;
const MIN_RESPONSE_RATE = 90;
const MAX_CANCELLATION_RATE = 1;
const MIN_BOOKINGS = 10;
const MIN_ACCOUNT_AGE_DAYS = 365;
const runSuperhostCalcJob = async () => {
    const startedAt = new Date();
    const tracker = (0, types_1.createJobResult)("SuperhostCalc", startedAt);
    let processed = 0;
    const errors = [];
    // Fetch all hosts
    const hosts = await database_1.prisma.user.findMany({
        where: { role: "host" },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            responseRate: true,
        },
    });
    const publisher = await (0, redis_1.getPublisher)();
    for (const host of hosts) {
        try {
            // Calculate metrics
            const totalBookings = await database_1.prisma.booking.count({
                where: { room: { hotel: { ownerId: host.id } } },
            });
            const completedBookings = await database_1.prisma.booking.count({
                where: { room: { hotel: { ownerId: host.id } }, status: "checked_out" },
            });
            const cancelledByHost = await database_1.prisma.booking.count({
                where: {
                    room: { hotel: { ownerId: host.id } },
                    status: "cancelled",
                },
            });
            const reviews = await database_1.prisma.review.findMany({
                where: { receiverId: host.id },
                select: { rating: true },
            });
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
            const cancellationRate = totalBookings > 0 ? (cancelledByHost / totalBookings) * 100 : 0;
            const accountAgeDays = (Date.now() - new Date(host.createdAt).getTime()) /
                (1000 * 60 * 60 * 24);
            const isEligible = avgRating >= MIN_RATING &&
                host.responseRate >= MIN_RESPONSE_RATE &&
                cancellationRate < MAX_CANCELLATION_RATE &&
                completedBookings >= MIN_BOOKINGS &&
                accountAgeDays >= MIN_ACCOUNT_AGE_DAYS;
            const newStatus = isEligible ? "superhost" : "verified";
            // Upsert HostVerification
            const existing = await database_1.prisma.hostVerification.findUnique({
                where: { userId: host.id },
            });
            const previousStatus = existing?.status ?? "pending";
            await database_1.prisma.hostVerification.upsert({
                where: { userId: host.id },
                update: {
                    bookingsCompleted: completedBookings,
                    avgRating,
                    responseRate: host.responseRate,
                    cancellationRate: Math.round(cancellationRate),
                    status: newStatus,
                    updatedAt: new Date(),
                },
                create: {
                    userId: host.id,
                    bookingsCompleted: completedBookings,
                    avgRating,
                    responseRate: host.responseRate,
                    cancellationRate: Math.round(cancellationRate),
                    status: newStatus,
                },
            });
            // Update superhost flag on user
            await database_1.prisma.user.update({
                where: { id: host.id },
                data: { superhost: isEligible },
            });
            // Publish event only if status changed
            if (previousStatus !== newStatus) {
                const message = JSON.stringify({
                    type: "superhost.updated",
                    data: {
                        userId: host.id,
                        host: { id: host.id, name: host.name, email: host.email },
                        status: newStatus,
                        previousStatus,
                    },
                    timestamp: new Date().toISOString(),
                });
                await publisher.publish(types_1.EVENT_CHANNEL, message);
            }
            processed++;
        }
        catch (err) {
            errors.push(`Host ${host.id}: ${err.message}`);
            console.error(`[SuperhostCalc] Failed for host ${host.id}:`, err);
        }
    }
    tracker.finalize(processed, errors.length, errors);
};
exports.runSuperhostCalcJob = runSuperhostCalcJob;

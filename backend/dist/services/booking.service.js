"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const utils_1 = require("../utils");
const eventPublisher_1 = require("../utils/eventPublisher");
const LOCK_TTL_SECONDS = 5;
const PENDING_EXPIRES_MINUTES = 10;
const getLockKey = (roomId, checkIn, checkOut) => `booking:room:${roomId}:${checkIn.toISOString()}:${checkOut.toISOString()}`;
const calcNights = (checkIn, checkOut) => Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
exports.bookingService = {
    async createBooking(userId, payload) {
        if (payload.checkIn >= payload.checkOut) {
            throw new utils_1.AppError("Check-out must be after check-in", 400);
        }
        const room = await database_1.prisma.room.findUnique({
            where: { id: payload.roomId },
            include: { hotel: true },
        });
        if (!room) {
            throw new utils_1.AppError("Room not found", 404);
        }
        if (payload.guestCount > room.maxGuests) {
            throw new utils_1.AppError(`Guest count exceeds room max limit (${room.maxGuests})`, 400);
        }
        const redis = await (0, redis_1.getRedisClient)();
        const lockKey = getLockKey(payload.roomId, payload.checkIn, payload.checkOut);
        const lockValue = `${userId}:${Date.now()}`;
        const acquired = await redis.set(lockKey, lockValue, {
            NX: true,
            EX: LOCK_TTL_SECONDS,
        });
        if (!acquired) {
            throw new utils_1.AppError("Room is being booked. Please try again in a moment.", 409);
        }
        try {
            const conflictingBlocked = await database_1.prisma.blockedDates.findFirst({
                where: {
                    roomId: payload.roomId,
                    startDate: { lte: payload.checkOut },
                    endDate: { gte: payload.checkIn },
                },
            });
            if (conflictingBlocked) {
                throw new utils_1.AppError("Room is blocked for selected dates", 409);
            }
            const conflictingBooking = await database_1.prisma.booking.findFirst({
                where: {
                    roomId: payload.roomId,
                    checkIn: { lte: payload.checkOut },
                    checkOut: { gte: payload.checkIn },
                    status: { in: ["pending", "confirmed", "checked_in"] },
                },
            });
            if (conflictingBooking) {
                throw new utils_1.AppError("Room is already booked for selected dates", 409);
            }
            const nights = calcNights(payload.checkIn, payload.checkOut);
            const subtotal = room.basePrice * nights;
            const feeConfig = await database_1.prisma.serviceFeeConfig.findFirst({
                orderBy: { createdAt: "desc" },
            });
            const taxConfig = await database_1.prisma.taxConfiguration.findFirst({
                where: { region: "default" },
            });
            const serviceFeePercent = feeConfig?.percentage ?? 13;
            const serviceFeeCapPercent = 30;
            const serviceFee = Math.min(subtotal * (serviceFeePercent / 100), subtotal * (serviceFeeCapPercent / 100));
            const taxPercent = taxConfig?.taxPercentage ?? 5;
            const tax = (subtotal + serviceFee) * (taxPercent / 100);
            const amount = subtotal + serviceFee + tax;
            const expiresAt = new Date(Date.now() + PENDING_EXPIRES_MINUTES * 60 * 1000);
            const booking = await database_1.prisma.$transaction(async (tx) => {
                const created = await tx.booking.create({
                    data: {
                        userId,
                        roomId: payload.roomId,
                        checkIn: payload.checkIn,
                        checkOut: payload.checkOut,
                        guestCount: payload.guestCount,
                        notes: payload.notes,
                        amount,
                        status: "pending",
                        expiresAt,
                    },
                });
                await tx.bookingHistory.create({
                    data: {
                        bookingId: created.id,
                        status: "pending",
                        updatedBy: userId,
                        notes: "Booking created",
                    },
                });
                return created;
            });
            // Fire-and-forget: publish booking.created event before releasing lock
            database_1.prisma.booking
                .findUnique({
                where: { id: booking.id },
                include: {
                    guest: { select: { id: true, name: true, email: true } },
                    room: {
                        include: {
                            hotel: {
                                include: {
                                    owner: { select: { id: true, name: true, email: true } },
                                },
                            },
                        },
                    },
                },
            })
                .then((full) => {
                if (!full)
                    return;
                (0, eventPublisher_1.publishEvent)("booking.created", {
                    bookingId: full.id,
                    guest: full.guest,
                    host: full.room.hotel.owner,
                    room: { type: full.room.roomType },
                    hotel: { name: full.room.hotel.name },
                    checkIn: full.checkIn,
                    checkOut: full.checkOut,
                    amount: full.amount,
                    guestCount: full.guestCount,
                });
            })
                .catch(() => { });
            return booking;
        }
        finally {
            await redis.del(lockKey);
        }
    },
    async getMyBookings(userId) {
        return database_1.prisma.booking.findMany({
            where: { userId },
            include: {
                room: {
                    include: {
                        hotel: {
                            select: { id: true, name: true, location: true },
                        },
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async getHostBookings(hostId) {
        return database_1.prisma.booking.findMany({
            where: {
                room: {
                    hotel: { ownerId: hostId },
                },
            },
            include: {
                guest: { select: { id: true, name: true, email: true, avatar: true } },
                room: {
                    include: {
                        hotel: { select: { id: true, name: true, location: true } },
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async getBookingById(userId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: {
                    include: {
                        hotel: true,
                    },
                },
                payment: true,
                history: {
                    orderBy: { changedAt: "desc" },
                },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return booking;
    },
    async updateBooking(userId, bookingId, payload) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new utils_1.AppError("Booking not found", 404);
        if (booking.userId !== userId)
            throw new utils_1.AppError("Unauthorized", 403);
        if (!["pending", "confirmed"].includes(booking.status)) {
            throw new utils_1.AppError("Booking cannot be updated in current status", 400);
        }
        if (payload.checkIn &&
            payload.checkOut &&
            payload.checkIn >= payload.checkOut) {
            throw new utils_1.AppError("Check-out must be after check-in", 400);
        }
        const updated = await database_1.prisma.booking.update({
            where: { id: bookingId },
            data: {
                ...(typeof payload.guestCount === "number" && {
                    guestCount: payload.guestCount,
                }),
                ...(payload.checkIn && { checkIn: payload.checkIn }),
                ...(payload.checkOut && { checkOut: payload.checkOut }),
                ...(typeof payload.notes === "string" && { notes: payload.notes }),
            },
        });
        await database_1.prisma.bookingHistory.create({
            data: {
                bookingId,
                status: updated.status,
                updatedBy: userId,
                notes: "Booking details updated",
            },
        });
        return updated;
    },
    async cancelBooking(userId, bookingId, reason) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: {
                    include: {
                        hotel: {
                            include: {
                                owner: { select: { id: true, name: true, email: true } },
                            },
                        },
                    },
                },
                guest: { select: { id: true, name: true, email: true } },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canCancel = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canCancel) {
            throw new utils_1.AppError("Unauthorized to cancel this booking", 403);
        }
        if (["cancelled", "expired", "checked_out"].includes(booking.status)) {
            throw new utils_1.AppError("Booking cannot be cancelled in current status", 400);
        }
        const cancelledBooking = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: "cancelled",
                    notes: reason
                        ? `${booking.notes || ""}\nCancellation reason: ${reason}`.trim()
                        : booking.notes,
                },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "cancelled",
                    updatedBy: userId,
                    notes: reason || "Booking cancelled",
                },
            });
            return updated;
        });
        // Fire-and-forget: notify guest and host
        (0, eventPublisher_1.publishEvent)("booking.cancelled", {
            bookingId,
            guest: booking.guest,
            host: booking.room.hotel.owner,
            hotel: { name: booking.room.hotel.name },
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            reason,
        }).catch(() => { });
        return cancelledBooking;
    },
    async getCancellationPreview(userId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: {
                    include: {
                        hotel: {
                            include: {
                                cancellationPolicy: true,
                            },
                        },
                    },
                },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const now = new Date();
        const msUntilCheckIn = booking.checkIn.getTime() - now.getTime();
        const hoursUntilCheckIn = Math.max(0, Math.floor(msUntilCheckIn / 3600000));
        const policy = booking.room.hotel.cancellationPolicy;
        const policyType = policy?.policyType || booking.cancellationPolicy || "moderate";
        let refundablePercent = 0;
        if (policy) {
            if (hoursUntilCheckIn >= policy.freeCancellationHours) {
                refundablePercent = 100;
            }
            else {
                refundablePercent = Math.max(0, policy.partialRefundPercent);
            }
        }
        else {
            // Default fallback policy behavior for legacy bookings.
            if (policyType === "flexible") {
                refundablePercent = hoursUntilCheckIn >= 24 ? 100 : 50;
            }
            else if (policyType === "strict") {
                refundablePercent = hoursUntilCheckIn >= 168 ? 50 : 0;
            }
            else {
                refundablePercent = hoursUntilCheckIn >= 120 ? 100 : 50;
            }
        }
        const totalPaid = booking.amount;
        const refundableAmount = Number(((totalPaid * refundablePercent) / 100).toFixed(2));
        const nonRefundableAmount = Number((totalPaid - refundableAmount).toFixed(2));
        return {
            bookingId: booking.id,
            policyType,
            hoursUntilCheckIn,
            refundablePercent,
            totalPaid,
            refundableAmount,
            nonRefundableAmount,
            canCancel: !["cancelled", "expired", "checked_out"].includes(booking.status),
        };
    },
    async confirmCheckIn(ownerId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can confirm check-in", 403);
        }
        if (booking.status !== "confirmed") {
            throw new utils_1.AppError("Only confirmed bookings can be checked in", 400);
        }
        const checkedIn = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: { status: "checked_in" },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "checked_in",
                    updatedBy: ownerId,
                    notes: "Guest checked in",
                },
            });
            return updated;
        });
        // Fire-and-forget: notify guest
        database_1.prisma.user
            .findUnique({
            where: { id: booking.userId },
            select: { id: true, name: true, email: true },
        })
            .then((guest) => {
            if (!guest)
                return;
            (0, eventPublisher_1.publishEvent)("booking.checked_in", {
                bookingId,
                guest,
                hotel: { name: booking.room.hotel.name },
                checkOut: booking.checkOut,
            });
        })
            .catch(() => { });
        return checkedIn;
    },
    async confirmCheckOut(ownerId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can confirm check-out", 403);
        }
        if (booking.status !== "checked_in") {
            throw new utils_1.AppError("Only checked-in bookings can be checked out", 400);
        }
        const checkedOut = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: { status: "checked_out" },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "checked_out",
                    updatedBy: ownerId,
                    notes: "Guest checked out",
                },
            });
            return updated;
        });
        // Fire-and-forget: notify guest
        database_1.prisma.user
            .findUnique({
            where: { id: booking.userId },
            select: { id: true, name: true, email: true },
        })
            .then((guest) => {
            if (!guest)
                return;
            (0, eventPublisher_1.publishEvent)("booking.checked_out", {
                bookingId,
                guest,
                hotel: { name: booking.room.hotel.name },
            });
        })
            .catch(() => { });
        return checkedOut;
    },
    async hostAcceptBooking(ownerId, bookingId) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can accept booking", 403);
        }
        if (booking.status !== "pending") {
            throw new utils_1.AppError("Only pending bookings can be accepted", 400);
        }
        const accepted = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: { status: "confirmed", expiresAt: null },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "confirmed",
                    updatedBy: ownerId,
                    notes: "Booking accepted by host",
                },
            });
            return updated;
        });
        return accepted;
    },
    async hostDeclineBooking(ownerId, bookingId, reason) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can decline booking", 403);
        }
        if (booking.status !== "pending") {
            throw new utils_1.AppError("Only pending bookings can be declined", 400);
        }
        const declined = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: "cancelled",
                    expiresAt: null,
                    notes: reason
                        ? `${booking.notes || ""}\nHost decline reason: ${reason}`.trim()
                        : booking.notes,
                },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "cancelled",
                    updatedBy: ownerId,
                    notes: reason || "Booking declined by host",
                },
            });
            return updated;
        });
        return declined;
    },
    async hostAlterBooking(ownerId, bookingId, payload) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: { include: { hotel: true } },
            },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can alter booking", 403);
        }
        if (!["pending", "confirmed"].includes(booking.status)) {
            throw new utils_1.AppError("Only pending or confirmed bookings can be altered", 400);
        }
        const nextCheckIn = payload.checkIn ?? booking.checkIn;
        const nextCheckOut = payload.checkOut ?? booking.checkOut;
        const nextGuestCount = payload.guestCount ?? booking.guestCount;
        if (nextCheckIn >= nextCheckOut) {
            throw new utils_1.AppError("Check-out must be after check-in", 400);
        }
        if (nextGuestCount > booking.room.maxGuests) {
            throw new utils_1.AppError(`Guest count exceeds room max limit (${booking.room.maxGuests})`, 400);
        }
        const blocked = await database_1.prisma.blockedDates.findFirst({
            where: {
                roomId: booking.roomId,
                startDate: { lte: nextCheckOut },
                endDate: { gte: nextCheckIn },
            },
        });
        if (blocked) {
            throw new utils_1.AppError("Room is blocked for selected altered dates", 409);
        }
        const conflictingBooking = await database_1.prisma.booking.findFirst({
            where: {
                id: { not: bookingId },
                roomId: booking.roomId,
                checkIn: { lte: nextCheckOut },
                checkOut: { gte: nextCheckIn },
                status: { in: ["pending", "confirmed", "checked_in"] },
            },
        });
        if (conflictingBooking) {
            throw new utils_1.AppError("Room has conflicting booking for altered dates", 409);
        }
        const nights = calcNights(nextCheckIn, nextCheckOut);
        const subtotal = booking.room.basePrice * nights;
        const feeConfig = await database_1.prisma.serviceFeeConfig.findFirst({
            orderBy: { createdAt: "desc" },
        });
        const taxConfig = await database_1.prisma.taxConfiguration.findFirst({
            where: { region: "default" },
        });
        const serviceFeePercent = feeConfig?.percentage ?? 13;
        const serviceFeeCapPercent = 30;
        const serviceFee = Math.min(subtotal * (serviceFeePercent / 100), subtotal * (serviceFeeCapPercent / 100));
        const taxPercent = taxConfig?.taxPercentage ?? 5;
        const tax = (subtotal + serviceFee) * (taxPercent / 100);
        const amount = subtotal + serviceFee + tax;
        const altered = await database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    checkIn: nextCheckIn,
                    checkOut: nextCheckOut,
                    guestCount: nextGuestCount,
                    amount,
                    notes: payload.notes !== undefined ? payload.notes : booking.notes,
                    status: booking.status === "pending" ? "confirmed" : booking.status,
                },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: updated.status,
                    updatedBy: ownerId,
                    notes: "Booking altered by host",
                },
            });
            return updated;
        });
        return altered;
    },
    async hostMarkNoShow(ownerId, bookingId, notes) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking)
            throw new utils_1.AppError("Booking not found", 404);
        if (booking.room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Only host can mark no-show", 403);
        }
        if (!["confirmed", "checked_in"].includes(booking.status)) {
            throw new utils_1.AppError("Only confirmed/checked-in bookings can be marked no-show", 400);
        }
        const updated = await database_1.prisma.$transaction(async (tx) => {
            const b = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: "cancelled",
                    notes: notes
                        ? `${booking.notes || ""}\nMarked no-show: ${notes}`.trim()
                        : `${booking.notes || ""}\nMarked no-show`.trim(),
                },
            });
            await tx.bookingHistory.create({
                data: {
                    bookingId,
                    status: "cancelled",
                    updatedBy: ownerId,
                    notes: notes || "Guest marked as no-show by host",
                },
            });
            return b;
        });
        return updated;
    },
};
exports.default = exports.bookingService;

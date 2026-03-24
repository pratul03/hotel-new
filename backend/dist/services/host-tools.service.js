"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostToolsService = void 0;
const database_1 = require("../config/database");
const utils_1 = require("../utils");
const ensureHotelOwner = async (hotelId, hostId) => {
    const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel || hotel.ownerId !== hostId) {
        throw new utils_1.AppError("Unauthorized", 403);
    }
    return hotel;
};
exports.hostToolsService = {
    async getCancellationPolicy(hotelId, hostId) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.hotelCancellationPolicy.findUnique({ where: { hotelId } });
    },
    async upsertCancellationPolicy(hotelId, hostId, payload) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.hotelCancellationPolicy.upsert({
            where: { hotelId },
            update: payload,
            create: { hotelId, ...payload },
        });
    },
    async listQuickReplies(hostId) {
        return database_1.prisma.quickReplyTemplate.findMany({
            where: { userId: hostId },
            orderBy: { updatedAt: "desc" },
        });
    },
    async createQuickReply(hostId, payload) {
        return database_1.prisma.quickReplyTemplate.create({
            data: {
                userId: hostId,
                title: payload.title,
                content: payload.content,
                category: payload.category ?? "general",
            },
        });
    },
    async deleteQuickReply(hostId, templateId) {
        const template = await database_1.prisma.quickReplyTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template || template.userId !== hostId) {
            throw new utils_1.AppError("Quick reply template not found", 404);
        }
        await database_1.prisma.quickReplyTemplate.delete({ where: { id: templateId } });
        return { id: templateId };
    },
    async listScheduledMessages(hostId) {
        return database_1.prisma.scheduledMessage.findMany({
            where: { senderUserId: hostId },
            orderBy: { sendAt: "asc" },
            include: {
                receiver: { select: { id: true, name: true, email: true } },
            },
        });
    },
    async createScheduledMessage(hostId, payload) {
        if (payload.sendAt <= new Date()) {
            throw new utils_1.AppError("sendAt must be in the future", 400);
        }
        return database_1.prisma.scheduledMessage.create({
            data: {
                senderUserId: hostId,
                receiverUserId: payload.receiverUserId,
                bookingId: payload.bookingId,
                content: payload.content,
                sendAt: payload.sendAt,
                status: "scheduled",
            },
        });
    },
    async cancelScheduledMessage(hostId, id) {
        const message = await database_1.prisma.scheduledMessage.findUnique({ where: { id } });
        if (!message || message.senderUserId !== hostId) {
            throw new utils_1.AppError("Scheduled message not found", 404);
        }
        if (message.status !== "scheduled") {
            throw new utils_1.AppError("Only scheduled messages can be cancelled", 400);
        }
        return database_1.prisma.scheduledMessage.update({
            where: { id },
            data: { status: "cancelled" },
        });
    },
    async getAnalytics(hostId, rangeDays = 30) {
        const safeDays = Math.min(Math.max(rangeDays, 7), 365);
        const start = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
        const bookings = await database_1.prisma.booking.findMany({
            where: {
                createdAt: { gte: start },
                room: { hotel: { ownerId: hostId } },
            },
            select: {
                id: true,
                status: true,
                amount: true,
                checkIn: true,
                checkOut: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        });
        const total = bookings.length;
        const confirmed = bookings.filter((b) => b.status === "confirmed").length;
        const checkedOut = bookings.filter((b) => b.status === "checked_out").length;
        const cancelled = bookings.filter((b) => b.status === "cancelled").length;
        const revenue = bookings
            .filter((b) => ["confirmed", "checked_in", "checked_out"].includes(b.status))
            .reduce((s, b) => s + b.amount, 0);
        const leadTimes = bookings
            .filter((b) => b.checkIn > b.createdAt)
            .map((b) => Math.ceil((b.checkIn.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
        const avgLeadTimeDays = leadTimes.length > 0
            ? leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length
            : 0;
        const reviewAgg = await database_1.prisma.review.aggregate({
            where: {
                receiverId: hostId,
                createdAt: { gte: start },
            },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const occupancyNights = bookings
            .filter((b) => ["confirmed", "checked_in", "checked_out"].includes(b.status))
            .reduce((sum, b) => {
            const nights = Math.max(1, Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) /
                (1000 * 60 * 60 * 24)));
            return sum + nights;
        }, 0);
        const roomsCount = await database_1.prisma.room.count({
            where: { hotel: { ownerId: hostId } },
        });
        const occupancyRate = roomsCount > 0 ? occupancyNights / (roomsCount * safeDays) : 0;
        return {
            rangeDays: safeDays,
            totals: {
                bookings: total,
                confirmed,
                checkedOut,
                cancelled,
                conversionRate: total > 0 ? confirmed / total : 0,
                cancellationRate: total > 0 ? cancelled / total : 0,
                revenue,
                avgLeadTimeDays,
                avgRating: reviewAgg._avg.rating ?? 0,
                reviewsCount: reviewAgg._count.rating,
                occupancyRate,
            },
        };
    },
    async getListingQuality(hotelId, hostId) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.hotelListingToolkit.findUnique({ where: { hotelId } });
    },
    async upsertListingQuality(hotelId, hostId, payload) {
        const hotel = await ensureHotelOwner(hotelId, hostId);
        const checklist = [
            Boolean(hotel.description && hotel.description.trim().length > 40),
            Boolean(hotel.amenities && hotel.amenities !== "[]"),
            Boolean(payload.coverImageUrl && payload.coverImageUrl.trim()),
            Boolean(payload.guidebook && payload.guidebook.trim().length > 20),
            Boolean(payload.houseManual && payload.houseManual.trim().length > 20),
            Boolean(payload.checkInSteps && payload.checkInSteps.trim().length > 10),
        ];
        const completenessScore = Math.round((checklist.filter(Boolean).length / checklist.length) * 100);
        return database_1.prisma.hotelListingToolkit.upsert({
            where: { hotelId },
            update: {
                ...payload,
                completenessScore,
            },
            create: {
                hotelId,
                ...payload,
                completenessScore,
            },
        });
    },
    async listCoHosts(hotelId, hostId) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.coHostAssignment.findMany({
            where: { hotelId },
            include: {
                cohost: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async addCoHost(hotelId, hostId, payload) {
        await ensureHotelOwner(hotelId, hostId);
        if (payload.cohostUserId === hostId) {
            throw new utils_1.AppError("Host cannot assign self as co-host", 400);
        }
        return database_1.prisma.coHostAssignment.upsert({
            where: {
                hotelId_cohostUserId: {
                    hotelId,
                    cohostUserId: payload.cohostUserId,
                },
            },
            update: {
                permissions: JSON.stringify(payload.permissions ?? []),
                revenueSplitPercent: payload.revenueSplitPercent ?? 0,
            },
            create: {
                hotelId,
                hostUserId: hostId,
                cohostUserId: payload.cohostUserId,
                permissions: JSON.stringify(payload.permissions ?? []),
                revenueSplitPercent: payload.revenueSplitPercent ?? 0,
            },
        });
    },
    async removeCoHost(hotelId, hostId, assignmentId) {
        await ensureHotelOwner(hotelId, hostId);
        const assignment = await database_1.prisma.coHostAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment || assignment.hotelId !== hotelId) {
            throw new utils_1.AppError("Co-host assignment not found", 404);
        }
        await database_1.prisma.coHostAssignment.delete({ where: { id: assignmentId } });
        return { id: assignmentId };
    },
    async getComplianceChecklist(hotelId, hostId) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.hotelComplianceChecklist.findUnique({ where: { hotelId } });
    },
    async upsertComplianceChecklist(hotelId, hostId, payload) {
        await ensureHotelOwner(hotelId, hostId);
        return database_1.prisma.hotelComplianceChecklist.upsert({
            where: { hotelId },
            update: {
                jurisdictionCode: payload.jurisdictionCode,
                checklistItems: JSON.stringify(payload.checklistItems),
                status: payload.status ?? "incomplete",
            },
            create: {
                hotelId,
                jurisdictionCode: payload.jurisdictionCode,
                checklistItems: JSON.stringify(payload.checklistItems),
                status: payload.status ?? "incomplete",
            },
        });
    },
    async listClaims(hostId) {
        return database_1.prisma.hostClaim.findMany({
            where: { hostUserId: hostId },
            include: {
                hotel: { select: { id: true, name: true } },
                booking: { select: { id: true, checkIn: true, checkOut: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async createClaim(hostId, payload) {
        await ensureHotelOwner(payload.hotelId, hostId);
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: payload.bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking || booking.room.hotel.id !== payload.hotelId) {
            throw new utils_1.AppError("Booking not found for this hotel", 404);
        }
        return database_1.prisma.hostClaim.create({
            data: {
                hotelId: payload.hotelId,
                bookingId: payload.bookingId,
                hostUserId: hostId,
                title: payload.title,
                description: payload.description,
                amountClaimed: payload.amountClaimed ?? 0,
                evidenceUrls: JSON.stringify(payload.evidenceUrls ?? []),
            },
        });
    },
};
exports.default = exports.hostToolsService;

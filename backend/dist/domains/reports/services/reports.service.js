"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const database_1 = require("../../../config/database");
const utils_1 = require("../../../utils");
const INCIDENT_STATUSES = [
    "open",
    "investigating",
    "resolved",
    "closed",
];
exports.reportService = {
    async reportIncident(userId, bookingId, description) {
        return database_1.prisma.incidentReport.create({
            data: {
                bookingId,
                reportedByUserId: userId,
                description,
            },
        });
    },
    async getIncident(userId, incidentId) {
        const incident = await database_1.prisma.incidentReport.findUnique({
            where: { id: incidentId },
            include: {
                booking: {
                    include: {
                        room: {
                            include: {
                                hotel: true,
                            },
                        },
                    },
                },
            },
        });
        if (!incident)
            throw new utils_1.AppError("Incident not found", 404);
        const canView = incident.reportedByUserId === userId ||
            incident.booking.userId === userId ||
            incident.booking.room.hotel.ownerId === userId;
        if (!canView)
            throw new utils_1.AppError("Unauthorized", 403);
        return incident;
    },
    async listIncidents(userId, filters) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!actor) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const baseWhere = {};
        if (filters?.status && INCIDENT_STATUSES.includes(filters.status)) {
            baseWhere.status = filters.status;
        }
        if (filters?.bookingId) {
            baseWhere.bookingId = filters.bookingId;
        }
        if (actor.role === "admin") {
            return database_1.prisma.incidentReport.findMany({
                where: baseWhere,
                include: {
                    reportedBy: { select: { id: true, name: true, email: true } },
                    booking: {
                        select: {
                            id: true,
                            userId: true,
                            room: {
                                select: {
                                    hotel: { select: { id: true, name: true, ownerId: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        }
        if (actor.role === "host") {
            return database_1.prisma.incidentReport.findMany({
                where: {
                    ...baseWhere,
                    OR: [
                        { reportedByUserId: userId },
                        {
                            booking: {
                                room: {
                                    hotel: {
                                        ownerId: userId,
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    reportedBy: { select: { id: true, name: true, email: true } },
                    booking: {
                        select: {
                            id: true,
                            userId: true,
                            room: {
                                select: {
                                    hotel: { select: { id: true, name: true, ownerId: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        }
        return database_1.prisma.incidentReport.findMany({
            where: {
                ...baseWhere,
                OR: [{ reportedByUserId: userId }, { booking: { userId } }],
            },
            include: {
                reportedBy: { select: { id: true, name: true, email: true } },
                booking: {
                    select: {
                        id: true,
                        userId: true,
                        room: {
                            select: {
                                hotel: { select: { id: true, name: true, ownerId: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async updateIncidentStatus(actorUserId, incidentId, status, resolution) {
        if (!INCIDENT_STATUSES.includes(status)) {
            throw new utils_1.AppError("Invalid incident status", 400);
        }
        const actor = await database_1.prisma.user.findUnique({ where: { id: actorUserId } });
        if (!actor) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const incident = await database_1.prisma.incidentReport.findUnique({
            where: { id: incidentId },
            include: {
                booking: {
                    include: {
                        room: {
                            include: {
                                hotel: true,
                            },
                        },
                    },
                },
            },
        });
        if (!incident) {
            throw new utils_1.AppError("Incident not found", 404);
        }
        const isAdmin = actor.role === "admin";
        const isIncidentHost = incident.booking.room.hotel.ownerId === actorUserId;
        if (!isAdmin && !isIncidentHost) {
            throw new utils_1.AppError("Only admin or host can update incident status", 403);
        }
        if (status === "resolved" && !resolution?.trim()) {
            throw new utils_1.AppError("Resolution is required when resolving incident", 400);
        }
        return database_1.prisma.incidentReport.update({
            where: { id: incidentId },
            data: {
                status,
                ...(resolution ? { resolution } : {}),
                resolvedAt: status === "resolved" ? new Date() : null,
            },
        });
    },
    async resolveIncident(adminUserId, incidentId, resolution) {
        const admin = await database_1.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!admin || admin.role !== "admin") {
            throw new utils_1.AppError("Only admin can resolve incidents", 403);
        }
        return this.updateIncidentStatus(adminUserId, incidentId, "resolved", resolution);
    },
    async getAirCoverBoard(userId) {
        const incidents = await this.listIncidents(userId);
        const emergencyTickets = await database_1.prisma.supportTicket.findMany({
            where: {
                userId,
                priority: "urgent",
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        const chargebackCases = await database_1.prisma.chargebackCase.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return {
            generatedAt: new Date().toISOString(),
            incidents,
            emergencyTickets,
            chargebackCases: chargebackCases.map((item) => ({
                ...item,
                evidenceUrls: JSON.parse(item.evidenceUrls || "[]"),
                timeline: JSON.parse(item.timeline || "[]"),
            })),
        };
    },
    async createOffPlatformFeeCase(userId, payload) {
        const booking = await database_1.prisma.booking.findUnique({
            where: { id: payload.bookingId },
            include: { room: { include: { hotel: true } } },
        });
        if (!booking) {
            throw new utils_1.AppError("Booking not found", 404);
        }
        const canAccess = booking.userId === userId || booking.room.hotel.ownerId === userId;
        if (!canAccess) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const created = await database_1.prisma.offPlatformFeeCase.create({
            data: {
                bookingId: payload.bookingId,
                reporterUserId: userId,
                description: payload.description,
                evidenceUrls: JSON.stringify(payload.evidenceUrls ?? []),
            },
        });
        return {
            ...created,
            evidenceUrls: JSON.parse(created.evidenceUrls || "[]"),
        };
    },
    async listOffPlatformFeeCases(userId) {
        const items = await database_1.prisma.offPlatformFeeCase.findMany({
            where: {
                reporterUserId: userId,
            },
            orderBy: { createdAt: "desc" },
        });
        return items.map((item) => ({
            ...item,
            evidenceUrls: JSON.parse(item.evidenceUrls || "[]"),
        }));
    },
};
exports.default = exports.reportService;

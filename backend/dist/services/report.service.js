"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const database_1 = require("../config/database");
const utils_1 = require("../utils");
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
            throw new utils_1.AppError('Incident not found', 404);
        const canView = incident.reportedByUserId === userId ||
            incident.booking.userId === userId ||
            incident.booking.room.hotel.ownerId === userId;
        if (!canView)
            throw new utils_1.AppError('Unauthorized', 403);
        return incident;
    },
    async resolveIncident(adminUserId, incidentId, resolution) {
        const admin = await database_1.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!admin || admin.role !== 'admin') {
            throw new utils_1.AppError('Only admin can resolve incidents', 403);
        }
        return database_1.prisma.incidentReport.update({
            where: { id: incidentId },
            data: {
                status: 'resolved',
                resolution,
                resolvedAt: new Date(),
            },
        });
    },
};
exports.default = exports.reportService;

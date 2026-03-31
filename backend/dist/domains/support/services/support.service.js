"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportService = void 0;
const database_1 = require("../../../config/database");
const utils_1 = require("../../../utils");
const STAGE_TO_STATUS = {
    pending_contact: "open",
    active_response: "in_progress",
    local_authority_notified: "in_progress",
    follow_up: "in_progress",
    closed: "resolved",
};
exports.supportService = {
    async createTicket(userId, subject, description, priority) {
        return database_1.prisma.supportTicket.create({
            data: {
                userId,
                subject,
                description,
                ...(priority && { priority }),
            },
        });
    },
    async getTickets(userId) {
        return database_1.prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },
    async getTicket(userId, ticketId) {
        const ticket = await database_1.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket || ticket.userId !== userId) {
            throw new utils_1.AppError("Ticket not found", 404);
        }
        return ticket;
    },
    async replyToTicket(userId, ticketId, reply) {
        const ticket = await database_1.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket || ticket.userId !== userId) {
            throw new utils_1.AppError("Ticket not found", 404);
        }
        return database_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                reply,
                status: "in_progress",
            },
        });
    },
    async createEmergencyTicket(userId, description, bookingId, locationHint) {
        const ticket = await database_1.prisma.supportTicket.create({
            data: {
                userId,
                subject: "Emergency safety request",
                description: [
                    description,
                    bookingId ? `Booking: ${bookingId}` : "",
                    locationHint ? `Location hint: ${locationHint}` : "",
                ]
                    .filter(Boolean)
                    .join("\n"),
                priority: "urgent",
            },
        });
        return {
            ticket,
            escalationStage: "pending_contact",
            immediateSteps: [
                "If you are in immediate danger, call local emergency services first.",
                "Move to a safe public place if possible.",
                "Keep your phone line available for support follow-up.",
            ],
        };
    },
    async escalateEmergencyTicket(userId, ticketId, stage, notes) {
        const ticket = await database_1.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket || ticket.userId !== userId) {
            throw new utils_1.AppError("Ticket not found", 404);
        }
        if (ticket.subject !== "Emergency safety request") {
            throw new utils_1.AppError("Only emergency tickets can be escalated", 400);
        }
        const timelineEntry = `[escalation_stage]${stage}${notes ? `|${notes}` : ""}`;
        const updated = await database_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: STAGE_TO_STATUS[stage],
                reply: ticket.reply
                    ? `${ticket.reply}\n${timelineEntry}`
                    : timelineEntry,
            },
        });
        return {
            ...updated,
            escalationStage: stage,
        };
    },
    async getSafetyOpsRoutingConsole(adminUserId, days = 7) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!actor || actor.role !== "admin") {
            throw new utils_1.AppError("Only admins can access safety routing console", 403);
        }
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - Math.max(1, days));
        const [urgentTickets, activeIncidents] = await Promise.all([
            database_1.prisma.supportTicket.findMany({
                where: {
                    priority: "urgent",
                    status: { in: ["open", "in_progress"] },
                    createdAt: { gte: windowStart },
                },
                select: {
                    id: true,
                    subject: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            }),
            database_1.prisma.incidentReport.findMany({
                where: {
                    status: { in: ["open", "investigating"] },
                    createdAt: { gte: windowStart },
                },
                select: {
                    id: true,
                    description: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            lookbackDays: days,
            queue: {
                urgentSupportTickets: urgentTickets,
                activeIncidents,
            },
            routingSuggestions: {
                trustAndSafetyPod: activeIncidents.length,
                frontlineSupport: urgentTickets.length,
                externalEscalationRequired: activeIncidents.filter((incident) => incident.description.toLowerCase().includes("critical") ||
                    incident.description.toLowerCase().includes("emergency")).length,
            },
        };
    },
    async getOpsDashboard(adminUserId, days = 30) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!actor || actor.role !== "admin") {
            throw new utils_1.AppError("Only admins can access ops dashboard", 403);
        }
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - Math.max(1, days));
        const [tickets, incidents] = await Promise.all([
            database_1.prisma.supportTicket.findMany({
                where: { createdAt: { gte: windowStart } },
                select: { status: true },
            }),
            database_1.prisma.incidentReport.findMany({
                where: { createdAt: { gte: windowStart } },
                select: { status: true, resolvedAt: true, createdAt: true },
            }),
        ]);
        const resolvedTickets = tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length;
        const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved" && incident.resolvedAt);
        const incidentResolutionWithin24h = resolvedIncidents.filter((incident) => {
            const resolvedAt = incident.resolvedAt;
            const createdAt = incident.createdAt;
            return resolvedAt.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
        }).length;
        return {
            generatedAt: new Date().toISOString(),
            lookbackDays: days,
            support: {
                total: tickets.length,
                resolved: resolvedTickets,
                slaResolutionRate: tickets.length === 0
                    ? 1
                    : Number((resolvedTickets / tickets.length).toFixed(2)),
            },
            safety: {
                totalIncidents: incidents.length,
                resolved: resolvedIncidents.length,
                resolvedWithin24h: incidentResolutionWithin24h,
                slaResolutionRate: incidents.length === 0
                    ? 1
                    : Number((incidentResolutionWithin24h / incidents.length).toFixed(2)),
            },
        };
    },
    async getSafetyOpsRoutingConsoleMock(adminUserId, days = 7) {
        return this.getSafetyOpsRoutingConsole(adminUserId, days);
    },
    async getOpsDashboardMock(adminUserId, days = 30) {
        return this.getOpsDashboard(adminUserId, days);
    },
};
exports.default = exports.supportService;

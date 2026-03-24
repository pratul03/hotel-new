"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportService = void 0;
const database_1 = require("../config/database");
const utils_1 = require("../utils");
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
            immediateSteps: [
                "If you are in immediate danger, call local emergency services first.",
                "Move to a safe public place if possible.",
                "Keep your phone line available for support follow-up.",
            ],
        };
    },
};
exports.default = exports.supportService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportController = void 0;
const utils_1 = require("../../../utils");
const support_queries_1 = require("../queries/support.queries");
const support_schema_1 = require("../schemas/support.schema");
const support_service_1 = require("../services/support.service");
exports.supportController = {
    async createTicket(req, res) {
        const payload = support_schema_1.createTicketSchema.parse(req.body);
        const ticket = await support_service_1.supportService.createTicket(support_queries_1.supportQueries.userId(req), payload.subject, payload.description, payload.priority);
        res.status(201).json((0, utils_1.successResponse)(ticket, "Support ticket created"));
    },
    async getTickets(req, res) {
        const tickets = await support_service_1.supportService.getTickets(support_queries_1.supportQueries.userId(req));
        res.json((0, utils_1.successResponse)(tickets, "Support tickets fetched"));
    },
    async getTicket(req, res) {
        const ticket = await support_service_1.supportService.getTicket(support_queries_1.supportQueries.userId(req), support_queries_1.supportQueries.ticketId(req));
        res.json((0, utils_1.successResponse)(ticket, "Support ticket fetched"));
    },
    async reply(req, res) {
        const payload = support_schema_1.replySchema.parse(req.body);
        const ticket = await support_service_1.supportService.replyToTicket(support_queries_1.supportQueries.userId(req), support_queries_1.supportQueries.ticketId(req), payload.reply);
        res.json((0, utils_1.successResponse)(ticket, "Reply added to ticket"));
    },
    async escalate(req, res) {
        const payload = support_schema_1.escalationSchema.parse(req.body);
        const data = await support_service_1.supportService.escalateEmergencyTicket(support_queries_1.supportQueries.userId(req), support_queries_1.supportQueries.ticketId(req), payload.stage, payload.notes);
        res.json((0, utils_1.successResponse)(data, "Emergency ticket escalation updated"));
    },
    async createEmergency(req, res) {
        const payload = support_schema_1.emergencySchema.parse(req.body);
        const data = await support_service_1.supportService.createEmergencyTicket(support_queries_1.supportQueries.userId(req), payload.description, payload.bookingId, payload.locationHint);
        res.status(201).json((0, utils_1.successResponse)(data, "Emergency request submitted"));
    },
    async routingConsole(req, res) {
        const payload = support_schema_1.routingConsoleQuerySchema.parse(req.query);
        const data = await support_service_1.supportService.getSafetyOpsRoutingConsole(support_queries_1.supportQueries.userId(req), payload.days);
        res.json((0, utils_1.successResponse)(data, "Safety ops routing console fetched"));
    },
    async opsDashboard(req, res) {
        const payload = support_schema_1.opsDashboardQuerySchema.parse(req.query);
        const data = await support_service_1.supportService.getOpsDashboard(support_queries_1.supportQueries.userId(req), payload.days);
        res.json((0, utils_1.successResponse)(data, "Ops dashboard fetched"));
    },
};
exports.default = exports.supportController;

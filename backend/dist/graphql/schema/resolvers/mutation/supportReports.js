"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportReportsMutationResolvers = void 0;
const reports_schema_1 = require("../../../../domains/reports/schemas/reports.schema");
const reports_service_1 = require("../../../../domains/reports/services/reports.service");
const support_schema_1 = require("../../../../domains/support/schemas/support.schema");
const support_service_1 = require("../../../../domains/support/services/support.service");
const context_1 = require("../../../context");
exports.supportReportsMutationResolvers = {
    supportCreateTicket: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = support_schema_1.createTicketSchema.parse(args.input);
        return support_service_1.supportService.createTicket(auth.userId, parsed.subject, parsed.description, parsed.priority);
    },
    supportReply: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = support_schema_1.replySchema.parse(args.input);
        return support_service_1.supportService.replyToTicket(auth.userId, args.ticketId, parsed.reply);
    },
    supportEscalate: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = support_schema_1.escalationSchema.parse(args.input);
        return support_service_1.supportService.escalateEmergencyTicket(auth.userId, args.ticketId, parsed.stage, parsed.notes);
    },
    supportCreateEmergency: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = support_schema_1.emergencySchema.parse(args.input);
        return support_service_1.supportService.createEmergencyTicket(auth.userId, parsed.description, parsed.bookingId, parsed.locationHint);
    },
    reportIncident: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = reports_schema_1.createSchema.parse(args.input);
        return reports_service_1.reportService.reportIncident(auth.userId, parsed.bookingId, parsed.description);
    },
    updateIncidentStatus: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = reports_schema_1.statusSchema.parse(args.input);
        return reports_service_1.reportService.updateIncidentStatus(auth.userId, args.incidentId, parsed.status, parsed.resolution);
    },
    resolveIncident: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = reports_schema_1.resolveSchema.parse(args.input);
        return reports_service_1.reportService.resolveIncident(auth.userId, args.incidentId, parsed.resolution);
    },
    createOffPlatformFeeCase: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = reports_schema_1.offPlatformFeeSchema.parse(args.input);
        return reports_service_1.reportService.createOffPlatformFeeCase(auth.userId, parsed);
    },
};

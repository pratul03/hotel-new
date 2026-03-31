"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportReportsQueryResolvers = void 0;
const reports_service_1 = require("../../../../domains/reports/services/reports.service");
const reports_schema_1 = require("../../../../domains/reports/schemas/reports.schema");
const support_service_1 = require("../../../../domains/support/services/support.service");
const support_schema_1 = require("../../../../domains/support/schemas/support.schema");
const context_1 = require("../../../context");
exports.supportReportsQueryResolvers = {
    supportTickets: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return support_service_1.supportService.getTickets(auth.userId);
    },
    supportTicket: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return support_service_1.supportService.getTicket(auth.userId, args.ticketId);
    },
    supportRoutingConsole: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = support_schema_1.routingConsoleQuerySchema.parse({ days: args.days });
        return support_service_1.supportService.getSafetyOpsRoutingConsole(auth.userId, parsed.days);
    },
    supportOpsDashboard: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = support_schema_1.opsDashboardQuerySchema.parse({ days: args.days });
        return support_service_1.supportService.getOpsDashboard(auth.userId, parsed.days);
    },
    incidents: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = reports_schema_1.listSchema.parse(args);
        return reports_service_1.reportService.listIncidents(auth.userId, parsed);
    },
    incidentById: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return reports_service_1.reportService.getIncident(auth.userId, args.incidentId);
    },
    airCoverBoard: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return reports_service_1.reportService.getAirCoverBoard(auth.userId);
    },
    offPlatformFeeCases: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return reports_service_1.reportService.listOffPlatformFeeCases(auth.userId);
    },
};

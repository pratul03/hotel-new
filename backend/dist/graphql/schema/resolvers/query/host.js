"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostQueryResolvers = void 0;
const host_finance_schema_1 = require("../../../../domains/host-finance/schemas/host-finance.schema");
const host_finance_service_1 = require("../../../../domains/host-finance/services/host-finance.service");
const host_profile_service_1 = require("../../../../domains/host-profile/services/host-profile.service");
const host_tools_schema_1 = require("../../../../domains/host-tools/schemas/host-tools.schema");
const host_tools_service_1 = require("../../../../domains/host-tools/services/host-tools.service");
const context_1 = require("../../../context");
exports.hostQueryResolvers = {
    hostProfile: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_profile_service_1.hostProfileService.getProfile(auth.userId);
    },
    hostFinanceEarnings: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ months: args.months });
        return host_finance_service_1.hostFinanceService.getEarningsOverview(auth.userId, parsed.months);
    },
    hostFinanceTransactions: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ limit: args.limit });
        return host_finance_service_1.hostFinanceService.getTransactions(auth.userId, parsed.limit);
    },
    hostPayoutAccount: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_finance_service_1.hostFinanceService.getPayoutAccount(auth.userId);
    },
    hostPayoutHistory: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ limit: args.limit });
        return host_finance_service_1.hostFinanceService.getPayoutHistory(auth.userId, parsed.limit);
    },
    hostCancellationPolicy: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.getCancellationPolicy(args.hotelId, auth.userId);
    },
    hostQuickReplies: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.listQuickReplies(auth.userId);
    },
    hostScheduledMessages: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.listScheduledMessages(auth.userId);
    },
    hostAnalytics: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.analyticsQuerySchema.parse({ days: args.days });
        return host_tools_service_1.hostToolsService.getAnalytics(auth.userId, parsed.days);
    },
    hostCoHosts: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.listCoHosts(args.hotelId, auth.userId);
    },
    hostComplianceChecklist: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.getComplianceChecklist(args.hotelId, auth.userId);
    },
    hostListingQuality: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.getListingQuality(args.hotelId, auth.userId);
    },
    hostClaims: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.listClaims(auth.userId);
    },
    hostComplianceAudit: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.auditExportQuerySchema.parse({ days: args.days });
        return host_tools_service_1.hostToolsService.exportComplianceAudit(auth.userId, parsed.days);
    },
};

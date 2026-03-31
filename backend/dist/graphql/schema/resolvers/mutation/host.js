"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostMutationResolvers = void 0;
const host_finance_schema_1 = require("../../../../domains/host-finance/schemas/host-finance.schema");
const host_finance_service_1 = require("../../../../domains/host-finance/services/host-finance.service");
const host_profile_schema_1 = require("../../../../domains/host-profile/schemas/host-profile.schema");
const host_profile_service_1 = require("../../../../domains/host-profile/services/host-profile.service");
const host_tools_schema_1 = require("../../../../domains/host-tools/schemas/host-tools.schema");
const host_tools_service_1 = require("../../../../domains/host-tools/services/host-tools.service");
const context_1 = require("../../../context");
exports.hostMutationResolvers = {
    createHostProfile: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host"]);
        const parsed = host_profile_schema_1.profileSchema.parse(args.input);
        return host_profile_service_1.hostProfileService.createProfile(auth.userId, parsed);
    },
    updateHostProfile: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_profile_schema_1.updateProfileSchema.parse(args.input);
        return host_profile_service_1.hostProfileService.updateProfile(auth.userId, parsed);
    },
    upsertHostPayoutAccount: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_finance_schema_1.payoutAccountSchema.parse(args.input);
        return host_finance_service_1.hostFinanceService.upsertPayoutAccount(auth.userId, parsed);
    },
    requestHostPayout: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_finance_schema_1.payoutRequestSchema.parse(args.input);
        return host_finance_service_1.hostFinanceService.requestPayout(auth.userId, parsed.amount, parsed.notes);
    },
    upsertHostCancellationPolicy: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.cancellationSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.upsertCancellationPolicy(args.hotelId, auth.userId, parsed);
    },
    createHostQuickReply: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.quickReplySchema.parse(args.input);
        return host_tools_service_1.hostToolsService.createQuickReply(auth.userId, parsed);
    },
    deleteHostQuickReply: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        await host_tools_service_1.hostToolsService.deleteQuickReply(auth.userId, args.templateId);
        return { deleted: true, message: "Quick reply deleted" };
    },
    createHostScheduledMessage: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.scheduledMessageSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.createScheduledMessage(auth.userId, {
            ...parsed,
            sendAt: new Date(parsed.sendAt),
        });
    },
    cancelHostScheduledMessage: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return host_tools_service_1.hostToolsService.cancelScheduledMessage(auth.userId, args.messageId);
    },
    addHostCoHost: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.addCohostSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.addCoHost(args.hotelId, auth.userId, parsed);
    },
    removeHostCoHost: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        await host_tools_service_1.hostToolsService.removeCoHost(args.hotelId, auth.userId, args.assignmentId);
        return { deleted: true, message: "Co-host removed" };
    },
    upsertHostComplianceChecklist: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.complianceSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.upsertComplianceChecklist(args.hotelId, auth.userId, parsed);
    },
    upsertHostListingQuality: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.listingQualitySchema.parse(args.input);
        return host_tools_service_1.hostToolsService.upsertListingQuality(args.hotelId, auth.userId, parsed);
    },
    createHostClaim: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = host_tools_schema_1.claimSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.createClaim(auth.userId, parsed);
    },
    adjudicateHostClaim: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = host_tools_schema_1.adjudicateClaimSchema.parse(args.input);
        return host_tools_service_1.hostToolsService.adjudicateClaim(auth.userId, args.claimId, parsed);
    },
};

import { hostFinanceQuerySchema } from "../../../../domains/host-finance/schemas/host-finance.schema";
import { hostFinanceService } from "../../../../domains/host-finance/services/host-finance.service";
import { hostProfileService } from "../../../../domains/host-profile/services/host-profile.service";
import {
  analyticsQuerySchema,
  auditExportQuerySchema,
} from "../../../../domains/host-tools/schemas/host-tools.schema";
import { hostToolsService } from "../../../../domains/host-tools/services/host-tools.service";
import { GraphQLContext, requireRole } from "../../../context";

export const hostQueryResolvers = {
  hostProfile: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostProfileService.getProfile(auth.userId);
  },

  hostFinanceEarnings: async (
    _parent: unknown,
    args: { months?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = hostFinanceQuerySchema.parse({ months: args.months });
    return hostFinanceService.getEarningsOverview(auth.userId, parsed.months);
  },

  hostFinanceTransactions: async (
    _parent: unknown,
    args: { limit?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = hostFinanceQuerySchema.parse({ limit: args.limit });
    return hostFinanceService.getTransactions(auth.userId, parsed.limit);
  },

  hostPayoutAccount: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostFinanceService.getPayoutAccount(auth.userId);
  },

  hostPayoutHistory: async (
    _parent: unknown,
    args: { limit?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = hostFinanceQuerySchema.parse({ limit: args.limit });
    return hostFinanceService.getPayoutHistory(auth.userId, parsed.limit);
  },

  hostCancellationPolicy: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.getCancellationPolicy(args.hotelId, auth.userId);
  },

  hostQuickReplies: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.listQuickReplies(auth.userId);
  },

  hostScheduledMessages: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.listScheduledMessages(auth.userId);
  },

  hostAnalytics: async (
    _parent: unknown,
    args: { days?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = analyticsQuerySchema.parse({ days: args.days });
    return hostToolsService.getAnalytics(auth.userId, parsed.days);
  },

  hostCoHosts: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.listCoHosts(args.hotelId, auth.userId);
  },

  hostComplianceChecklist: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.getComplianceChecklist(args.hotelId, auth.userId);
  },

  hostListingQuality: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.getListingQuality(args.hotelId, auth.userId);
  },

  hostClaims: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.listClaims(auth.userId);
  },

  hostComplianceAudit: async (
    _parent: unknown,
    args: { days?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = auditExportQuerySchema.parse({ days: args.days });
    return hostToolsService.exportComplianceAudit(auth.userId, parsed.days);
  },
};

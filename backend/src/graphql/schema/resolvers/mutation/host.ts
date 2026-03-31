import {
  payoutAccountSchema,
  payoutRequestSchema,
} from "../../../../domains/host-finance/schemas/host-finance.schema";
import { hostFinanceService } from "../../../../domains/host-finance/services/host-finance.service";
import {
  profileSchema as hostProfileSchema,
  updateProfileSchema as hostProfileUpdateSchema,
} from "../../../../domains/host-profile/schemas/host-profile.schema";
import { hostProfileService } from "../../../../domains/host-profile/services/host-profile.service";
import {
  addCohostSchema,
  adjudicateClaimSchema,
  cancellationSchema,
  claimSchema,
  complianceSchema,
  listingQualitySchema,
  quickReplySchema,
  scheduledMessageSchema,
} from "../../../../domains/host-tools/schemas/host-tools.schema";
import { hostToolsService } from "../../../../domains/host-tools/services/host-tools.service";
import { GraphQLContext, requireRole } from "../../../context";

export const hostMutationResolvers = {
  createHostProfile: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host"]);
    const parsed = hostProfileSchema.parse(args.input);
    return hostProfileService.createProfile(auth.userId, parsed);
  },

  updateHostProfile: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = hostProfileUpdateSchema.parse(args.input);
    return hostProfileService.updateProfile(auth.userId, parsed);
  },

  upsertHostPayoutAccount: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = payoutAccountSchema.parse(args.input);
    return hostFinanceService.upsertPayoutAccount(auth.userId, parsed);
  },

  requestHostPayout: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = payoutRequestSchema.parse(args.input);
    return hostFinanceService.requestPayout(
      auth.userId,
      parsed.amount,
      parsed.notes,
    );
  },

  upsertHostCancellationPolicy: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = cancellationSchema.parse(args.input);
    return hostToolsService.upsertCancellationPolicy(
      args.hotelId,
      auth.userId,
      parsed,
    );
  },

  createHostQuickReply: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = quickReplySchema.parse(args.input);
    return hostToolsService.createQuickReply(auth.userId, parsed);
  },

  deleteHostQuickReply: async (
    _parent: unknown,
    args: { templateId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    await hostToolsService.deleteQuickReply(auth.userId, args.templateId);
    return { deleted: true, message: "Quick reply deleted" };
  },

  createHostScheduledMessage: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = scheduledMessageSchema.parse(args.input);
    return hostToolsService.createScheduledMessage(auth.userId, {
      ...parsed,
      sendAt: new Date(parsed.sendAt),
    });
  },

  cancelHostScheduledMessage: async (
    _parent: unknown,
    args: { messageId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hostToolsService.cancelScheduledMessage(auth.userId, args.messageId);
  },

  addHostCoHost: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = addCohostSchema.parse(args.input);
    return hostToolsService.addCoHost(args.hotelId, auth.userId, parsed);
  },

  removeHostCoHost: async (
    _parent: unknown,
    args: { hotelId: string; assignmentId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    await hostToolsService.removeCoHost(
      args.hotelId,
      auth.userId,
      args.assignmentId,
    );
    return { deleted: true, message: "Co-host removed" };
  },

  upsertHostComplianceChecklist: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = complianceSchema.parse(args.input);
    return hostToolsService.upsertComplianceChecklist(
      args.hotelId,
      auth.userId,
      parsed,
    );
  },

  upsertHostListingQuality: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = listingQualitySchema.parse(args.input);
    return hostToolsService.upsertListingQuality(
      args.hotelId,
      auth.userId,
      parsed,
    );
  },

  createHostClaim: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = claimSchema.parse(args.input);
    return hostToolsService.createClaim(auth.userId, parsed);
  },

  adjudicateHostClaim: async (
    _parent: unknown,
    args: { claimId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = adjudicateClaimSchema.parse(args.input);
    return hostToolsService.adjudicateClaim(auth.userId, args.claimId, parsed);
  },
};

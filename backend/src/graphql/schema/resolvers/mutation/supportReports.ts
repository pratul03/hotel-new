import {
  createSchema as createIncidentSchema,
  offPlatformFeeSchema,
  resolveSchema as resolveIncidentSchema,
  statusSchema as incidentStatusSchema,
} from "../../../../domains/reports/schemas/reports.schema";
import { reportService } from "../../../../domains/reports/services/reports.service";
import {
  createTicketSchema,
  emergencySchema,
  escalationSchema,
  replySchema,
} from "../../../../domains/support/schemas/support.schema";
import { supportService } from "../../../../domains/support/services/support.service";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";

export const supportReportsMutationResolvers = {
  supportCreateTicket: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createTicketSchema.parse(args.input);
    return supportService.createTicket(
      auth.userId,
      parsed.subject,
      parsed.description,
      parsed.priority,
    );
  },

  supportReply: async (
    _parent: unknown,
    args: { ticketId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = replySchema.parse(args.input);
    return supportService.replyToTicket(
      auth.userId,
      args.ticketId,
      parsed.reply,
    );
  },

  supportEscalate: async (
    _parent: unknown,
    args: { ticketId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = escalationSchema.parse(args.input);
    return supportService.escalateEmergencyTicket(
      auth.userId,
      args.ticketId,
      parsed.stage,
      parsed.notes,
    );
  },

  supportCreateEmergency: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = emergencySchema.parse(args.input);
    return supportService.createEmergencyTicket(
      auth.userId,
      parsed.description,
      parsed.bookingId,
      parsed.locationHint,
    );
  },

  reportIncident: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createIncidentSchema.parse(args.input);
    return reportService.reportIncident(
      auth.userId,
      parsed.bookingId,
      parsed.description,
    );
  },

  updateIncidentStatus: async (
    _parent: unknown,
    args: { incidentId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = incidentStatusSchema.parse(args.input);
    return reportService.updateIncidentStatus(
      auth.userId,
      args.incidentId,
      parsed.status,
      parsed.resolution,
    );
  },

  resolveIncident: async (
    _parent: unknown,
    args: { incidentId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = resolveIncidentSchema.parse(args.input);
    return reportService.resolveIncident(
      auth.userId,
      args.incidentId,
      parsed.resolution,
    );
  },

  createOffPlatformFeeCase: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = offPlatformFeeSchema.parse(args.input);
    return reportService.createOffPlatformFeeCase(auth.userId, parsed);
  },
};

import { reportService } from "../../../../domains/reports/services/reports.service";
import { listSchema as listIncidentsSchema } from "../../../../domains/reports/schemas/reports.schema";
import { supportService } from "../../../../domains/support/services/support.service";
import {
  opsDashboardQuerySchema,
  routingConsoleQuerySchema,
} from "../../../../domains/support/schemas/support.schema";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";

export const supportReportsQueryResolvers = {
  supportTickets: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return supportService.getTickets(auth.userId);
  },

  supportTicket: async (
    _parent: unknown,
    args: { ticketId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return supportService.getTicket(auth.userId, args.ticketId);
  },

  supportRoutingConsole: async (
    _parent: unknown,
    args: { days?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = routingConsoleQuerySchema.parse({ days: args.days });
    return supportService.getSafetyOpsRoutingConsole(auth.userId, parsed.days);
  },

  supportOpsDashboard: async (
    _parent: unknown,
    args: { days?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = opsDashboardQuerySchema.parse({ days: args.days });
    return supportService.getOpsDashboard(auth.userId, parsed.days);
  },

  incidents: async (
    _parent: unknown,
    args: { status?: string; bookingId?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = listIncidentsSchema.parse(args);
    return reportService.listIncidents(auth.userId, parsed);
  },

  incidentById: async (
    _parent: unknown,
    args: { incidentId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return reportService.getIncident(auth.userId, args.incidentId);
  },

  airCoverBoard: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return reportService.getAirCoverBoard(auth.userId);
  },

  offPlatformFeeCases: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return reportService.listOffPlatformFeeCases(auth.userId);
  },
};

import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { supportQueries } from "../queries/support.queries";
import {
  createTicketSchema,
  emergencySchema,
  escalationSchema,
  opsDashboardQuerySchema,
  replySchema,
  routingConsoleQuerySchema,
} from "../schemas/support.schema";
import { supportService } from "../services/support.service";

export const supportController = {
  async createTicket(req: AuthenticatedRequest, res: Response) {
    const payload = createTicketSchema.parse(req.body);
    const ticket = await supportService.createTicket(
      supportQueries.userId(req),
      payload.subject,
      payload.description,
      payload.priority,
    );
    res.status(201).json(successResponse(ticket, "Support ticket created"));
  },

  async getTickets(req: AuthenticatedRequest, res: Response) {
    const tickets = await supportService.getTickets(supportQueries.userId(req));
    res.json(successResponse(tickets, "Support tickets fetched"));
  },

  async getTicket(req: AuthenticatedRequest, res: Response) {
    const ticket = await supportService.getTicket(
      supportQueries.userId(req),
      supportQueries.ticketId(req),
    );
    res.json(successResponse(ticket, "Support ticket fetched"));
  },

  async reply(req: AuthenticatedRequest, res: Response) {
    const payload = replySchema.parse(req.body);
    const ticket = await supportService.replyToTicket(
      supportQueries.userId(req),
      supportQueries.ticketId(req),
      payload.reply,
    );
    res.json(successResponse(ticket, "Reply added to ticket"));
  },

  async escalate(req: AuthenticatedRequest, res: Response) {
    const payload = escalationSchema.parse(req.body);
    const data = await supportService.escalateEmergencyTicket(
      supportQueries.userId(req),
      supportQueries.ticketId(req),
      payload.stage,
      payload.notes,
    );
    res.json(successResponse(data, "Emergency ticket escalation updated"));
  },

  async createEmergency(req: AuthenticatedRequest, res: Response) {
    const payload = emergencySchema.parse(req.body);
    const data = await supportService.createEmergencyTicket(
      supportQueries.userId(req),
      payload.description,
      payload.bookingId,
      payload.locationHint,
    );
    res.status(201).json(successResponse(data, "Emergency request submitted"));
  },

  async routingConsole(req: AuthenticatedRequest, res: Response) {
    const payload = routingConsoleQuerySchema.parse(req.query);
    const data = await supportService.getSafetyOpsRoutingConsole(
      supportQueries.userId(req),
      payload.days,
    );
    res.json(successResponse(data, "Safety ops routing console fetched"));
  },

  async opsDashboard(req: AuthenticatedRequest, res: Response) {
    const payload = opsDashboardQuerySchema.parse(req.query);
    const data = await supportService.getOpsDashboard(
      supportQueries.userId(req),
      payload.days,
    );
    res.json(successResponse(data, "Ops dashboard fetched"));
  },
};

export default supportController;

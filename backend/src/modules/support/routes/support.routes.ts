import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { supportService } from "../services/support.service";

const router = Router();

const createTicketSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

const replySchema = z.object({
  reply: z.string().min(1),
});

const emergencySchema = z.object({
  description: z.string().min(5),
  bookingId: z.string().min(1).optional(),
  locationHint: z.string().min(2).optional(),
});

const escalationSchema = z.object({
  stage: z.enum([
    "pending_contact",
    "active_response",
    "local_authority_notified",
    "follow_up",
    "closed",
  ]),
  notes: z.string().min(2).optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.post(
  "/tickets",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = createTicketSchema.parse(req.body);
    const ticket = await supportService.createTicket(
      req.userId as string,
      payload.subject,
      payload.description,
      payload.priority,
    );
    res.status(201).json(successResponse(ticket, "Support ticket created"));
  }),
);

router.get(
  "/tickets",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const tickets = await supportService.getTickets(req.userId as string);
    res.json(successResponse(tickets, "Support tickets fetched"));
  }),
);

router.get(
  "/tickets/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = getParam(req.params.id as string | string[] | undefined);
    const ticket = await supportService.getTicket(
      req.userId as string,
      ticketId,
    );
    res.json(successResponse(ticket, "Support ticket fetched"));
  }),
);

router.post(
  "/tickets/:id/reply",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = getParam(req.params.id as string | string[] | undefined);
    const payload = replySchema.parse(req.body);
    const ticket = await supportService.replyToTicket(
      req.userId as string,
      ticketId,
      payload.reply,
    );
    res.json(successResponse(ticket, "Reply added to ticket"));
  }),
);

router.post(
  "/tickets/:id/escalate",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = getParam(req.params.id as string | string[] | undefined);
    const payload = escalationSchema.parse(req.body);
    const data = await supportService.escalateEmergencyTicket(
      req.userId as string,
      ticketId,
      payload.stage,
      payload.notes,
    );
    res.json(successResponse(data, "Emergency ticket escalation updated"));
  }),
);

router.post(
  "/emergency",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = emergencySchema.parse(req.body);
    const data = await supportService.createEmergencyTicket(
      req.userId as string,
      payload.description,
      payload.bookingId,
      payload.locationHint,
    );
    res.status(201).json(successResponse(data, "Emergency request submitted"));
  }),
);

router.get(
  "/ops/routing-console",
  authenticate,
  requireRole(["admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = z
      .object({
        days: z.coerce.number().int().min(1).max(180).optional(),
      })
      .parse(req.query);

    const data = await supportService.getSafetyOpsRoutingConsole(
      req.userId as string,
      payload.days,
    );
    res.json(successResponse(data, "Safety ops routing console fetched"));
  }),
);

router.get(
  "/ops/dashboard",
  authenticate,
  requireRole(["admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = z
      .object({
        days: z.coerce.number().int().min(1).max(365).optional(),
      })
      .parse(req.query);

    const data = await supportService.getOpsDashboard(
      req.userId as string,
      payload.days,
    );
    res.json(successResponse(data, "Ops dashboard fetched"));
  }),
);

export default router;


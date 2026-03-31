import { z, v } from "../../../utils/validation";

export const createTicketSchema = z.object({
  subject: v.text(3, 255),
  description: v.text(5),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const replySchema = z.object({
  reply: v.id(),
});

export const emergencySchema = z.object({
  description: v.text(5),
  bookingId: v.id().optional(),
  locationHint: v.text(2).optional(),
});

export const escalationSchema = z.object({
  stage: z.enum([
    "pending_contact",
    "active_response",
    "local_authority_notified",
    "follow_up",
    "closed",
  ]),
  notes: v.text(2).optional(),
});

export const routingConsoleQuerySchema = z.object({
  days: v.int(1, 180).optional(),
});

export const opsDashboardQuerySchema = z.object({
  days: v.int(1, 365).optional(),
});

export const supportSchemas = {
  createTicketSchema,
  replySchema,
  emergencySchema,
  escalationSchema,
  routingConsoleQuerySchema,
  opsDashboardQuerySchema,
};

export default supportSchemas;

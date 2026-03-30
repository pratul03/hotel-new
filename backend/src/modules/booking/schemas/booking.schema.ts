import { z, v } from "../../../utils/validation";

export const createBookingSchema = z.object({
  roomId: v.id(),
  checkIn: v.isoDateTime(),
  checkOut: v.isoDateTime(),
  guestCount: v.positiveInt(),
  notes: v.text(1, 1000).optional(),
});

export const previewSchema = z.object({
  roomId: v.id(),
  checkIn: v.isoDateTime(),
  checkOut: v.isoDateTime(),
  guestCount: v.positiveInt().default(1),
});

export const riskSchema = z.object({
  roomId: v.id(),
  checkIn: v.isoDateTime(),
  checkOut: v.isoDateTime(),
  guestCount: v.positiveInt().default(1),
});

export const cancelSchema = z.object({
  reason: v.text(2, 500).optional(),
});

export const updateSchema = z.object({
  guestCount: v.positiveInt().optional(),
  checkIn: v.isoDateTime().optional(),
  checkOut: v.isoDateTime().optional(),
  notes: v.text(1, 1000).optional(),
});

export const hostDeclineSchema = z.object({
  reason: v.text(2, 500).optional(),
});

export const hostAlterSchema = z.object({
  guestCount: v.positiveInt().optional(),
  checkIn: v.isoDateTime().optional(),
  checkOut: v.isoDateTime().optional(),
  notes: v.text(1, 1000).optional(),
});

export const hostNoShowSchema = z.object({
  notes: v.text(1, 1000).optional(),
});

export const rebookingSchema = z.object({
  reason: v.text(3, 500),
});

export const travelDisruptionSchema = z.object({
  eventType: z.enum([
    "weather",
    "transport_strike",
    "airport_closure",
    "medical",
    "government_restriction",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const bookingSchemas = {
  createBookingSchema,
  previewSchema,
  riskSchema,
  cancelSchema,
  updateSchema,
  hostDeclineSchema,
  hostAlterSchema,
  hostNoShowSchema,
  rebookingSchema,
  travelDisruptionSchema,
};

export default bookingSchemas;

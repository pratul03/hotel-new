import { z, v } from "../../../utils/validation";

export const createSchema = z.object({
  bookingId: v.id(),
  description: v.text(5),
});

export const listSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  bookingId: v.id().optional(),
});

export const resolveSchema = z.object({
  resolution: v.text(3),
});

export const statusSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]),
  resolution: v.text(3).optional(),
});

export const offPlatformFeeSchema = z.object({
  bookingId: v.id(),
  description: v.text(5),
  evidenceUrls: z
    .array(v.url())
    .optional(),
});

export const reportsSchemas = {
  createSchema,
  listSchema,
  resolveSchema,
  statusSchema,
  offPlatformFeeSchema,
};

export default reportsSchemas;

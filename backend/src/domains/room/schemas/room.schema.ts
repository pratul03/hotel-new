import { z, v } from "../../../utils/validation";

export const createRoomSchema = z.object({
  roomType: v.id(),
  capacity: v.positiveInt(),
  maxGuests: v.positiveInt(),
  basePrice: v.positiveNumber(),
  amenities: z.array(v.id()).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const roomDateRangeQuerySchema = z.object({
  checkIn: v.isoDateTime(),
  checkOut: v.isoDateTime(),
});

export const presignedUrlQuerySchema = z.object({
  fileName: v.id().max(255),
});

export const roomSchemas = {
  createRoomSchema,
  updateRoomSchema,
  roomDateRangeQuerySchema,
  presignedUrlQuerySchema,
};

export default roomSchemas;

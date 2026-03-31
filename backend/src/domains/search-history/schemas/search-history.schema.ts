import { z, v } from "../../../utils/validation";

export const createSchema = z.object({
  queryLocation: v.id(),
  checkIn: v.isoDateTime().optional(),
  checkOut: v.isoDateTime().optional(),
  guests: v.positiveInt().optional(),
});

export const searchhistorySchemas = {
  createSchema,
};

export default searchhistorySchemas;

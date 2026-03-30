import { z, v } from "../../../utils/validation";

export const createReviewSchema = z.object({
  bookingId: v.id(),
  receiverId: v.id(),
  rating: v.int(1, 5),
  comment: v.trimmed(2000).optional(),
  categories: z.record(z.string(), z.coerce.number()).optional(),
  hotelId: v.id().optional(),
});

export const updateReviewSchema = z.object({
  rating: v.int(1, 5).optional(),
  comment: v.trimmed(2000).optional(),
  categories: z.record(z.string(), z.coerce.number()).optional(),
});

export const reviewSchemas = {
  createReviewSchema,
  updateReviewSchema,
};

export default reviewSchemas;

import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { prisma } from "../../../config/database";
import { successResponse } from "../../../utils";
import { reviewQueries } from "../queries/review.queries";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../schemas/review.schema";
import { reviewCrud, reviewService } from "../services/review.service";

export const reviewController = {
  getAll: reviewCrud.getAll,
  getOne: reviewCrud.getOne,

  async getByBooking(req: AuthenticatedRequest, res: Response) {
    const review = await prisma.review.findFirst({
      where: { bookingId: reviewQueries.bookingId(req) },
    });
    res.json(successResponse(review, "Review fetched for booking"));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const payload = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(
      reviewQueries.userId(req),
      payload,
    );
    res.status(201).json(successResponse(review, "Review submitted"));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const id = reviewQueries.id(req);
    const payload = updateReviewSchema.parse(req.body);
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing || existing.senderId !== reviewQueries.userId(req)) {
      res.status(404).json(successResponse(null, "Review not found"));
      return;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(typeof payload.rating === "number" && { rating: payload.rating }),
        ...(typeof payload.comment === "string" && {
          comment: payload.comment,
        }),
        ...(payload.categories && {
          categories: JSON.stringify(payload.categories),
        }),
      },
    });

    res.json(successResponse(updated, "Review updated"));
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const id = reviewQueries.id(req);
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing || existing.senderId !== reviewQueries.userId(req)) {
      res.status(404).json(successResponse(null, "Review not found"));
      return;
    }

    await prisma.review.delete({ where: { id } });
    res.json(successResponse({ deleted: true }, "Review deleted"));
  },
};

export default reviewController;

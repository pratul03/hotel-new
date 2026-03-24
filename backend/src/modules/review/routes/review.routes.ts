import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { reviewCrud, reviewService } from "../services/review.service";
import { prisma } from "../../../config/database";

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  receiverId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  categories: z.record(z.string(), z.number()).optional(),
  hotelId: z.string().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  categories: z.record(z.string(), z.number()).optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.get("/", reviewCrud.getAll);

router.get(
  "/booking/:bookingId",
  catchAsync(async (req, res: Response) => {
    const bookingId = getParam(
      req.params.bookingId as string | string[] | undefined,
    );
    const review = await prisma.review.findFirst({ where: { bookingId } });
    res.json(successResponse(review, "Review fetched for booking"));
  }),
);

router.get("/:id", reviewCrud.getOne);

router.post(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(review, "Review submitted"));
  }),
);

router.put(
  "/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const payload = updateReviewSchema.parse(req.body);

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.senderId !== (req.userId as string)) {
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
  }),
);

router.delete(
  "/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.senderId !== (req.userId as string)) {
      res.status(404).json(successResponse(null, "Review not found"));
      return;
    }

    await prisma.review.delete({ where: { id } });
    res.json(successResponse({ deleted: true }, "Review deleted"));
  }),
);

export default router;


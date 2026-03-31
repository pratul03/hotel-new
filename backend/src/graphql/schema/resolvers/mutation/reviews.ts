import { prisma } from "../../../../config/database";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../../../../domains/review/schemas/review.schema";
import { reviewService } from "../../../../domains/review/services/review.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const reviewMutationResolvers = {
  createReview: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createReviewSchema.parse(args.input);
    return reviewService.createReview(auth.userId, parsed);
  },

  updateReview: async (
    _parent: unknown,
    args: { reviewId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = updateReviewSchema.parse(args.input);
    const existing = await prisma.review.findUnique({
      where: { id: args.reviewId },
    });
    if (!existing || existing.senderId !== auth.userId) {
      throw new Error("Review not found");
    }

    return prisma.review.update({
      where: { id: args.reviewId },
      data: {
        ...(typeof parsed.rating === "number" && { rating: parsed.rating }),
        ...(typeof parsed.comment === "string" && {
          comment: parsed.comment,
        }),
        ...(parsed.categories && {
          categories: JSON.stringify(parsed.categories),
        }),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  deleteReview: async (
    _parent: unknown,
    args: { reviewId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const existing = await prisma.review.findUnique({
      where: { id: args.reviewId },
    });
    if (!existing || existing.senderId !== auth.userId) {
      throw new Error("Review not found");
    }
    await prisma.review.delete({ where: { id: args.reviewId } });
    return { deleted: true, message: "Review deleted" };
  },
};

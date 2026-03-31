import { prisma } from "../../../../config/database";
import { GraphQLContext, requireAuth } from "../../../context";

export const reviewQueryResolvers = {
  reviews: async (
    _parent: unknown,
    args: { bookingId?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const where = args.bookingId
      ? { bookingId: args.bookingId }
      : {
          OR: [
            { senderId: auth.userId },
            { receiverId: auth.userId },
            { booking: { userId: auth.userId } },
          ],
        };
    return prisma.review.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  reviewById: async (
    _parent: unknown,
    args: { reviewId: string },
    context: GraphQLContext,
  ) => {
    requireAuth(context);
    return prisma.review.findUnique({
      where: { id: args.reviewId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  reviewByBooking: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    requireAuth(context);
    return prisma.review.findFirst({
      where: { bookingId: args.bookingId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });
  },
};

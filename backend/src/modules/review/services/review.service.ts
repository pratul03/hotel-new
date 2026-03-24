import { createCrudHandlers, AppError } from "../../../utils";
import { prisma } from "../../../config/database";
import { publishEvent } from "../../../utils/eventPublisher";

export const reviewCrud = createCrudHandlers("review", {
  searchableFields: ["comment"],
  includeOnGetAll: {
    sender: { select: { id: true, name: true, avatar: true } },
    receiver: { select: { id: true, name: true, avatar: true } },
    booking: { select: { id: true, roomId: true } },
  },
  includeOnGetOne: {
    sender: { select: { id: true, name: true, avatar: true } },
    receiver: { select: { id: true, name: true, avatar: true } },
    booking: true,
  },
});

export const reviewService = {
  async createReview(
    senderId: string,
    data: {
      bookingId: string;
      receiverId: string;
      rating: number;
      comment?: string;
      categories?: Record<string, number>;
      hotelId?: string;
    },
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.userId !== senderId) {
      throw new AppError("Only the booking guest can submit review", 403);
    }

    if (booking.status !== "checked_out") {
      throw new AppError("Review can only be submitted after check-out", 400);
    }

    const review = await prisma.review.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment,
        categories: JSON.stringify(data.categories || {}),
        hotelId: data.hotelId,
      },
    });

    // Fire-and-forget: notify the reviewed user
    Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: data.receiverId },
        select: { id: true, name: true, email: true },
      }),
    ])
      .then(([sender, receiver]) => {
        if (!sender || !receiver) return;
        publishEvent("review.created", {
          reviewId: review.id,
          sender,
          receiver,
          rating: data.rating,
          comment: data.comment,
          bookingId: data.bookingId,
        });
      })
      .catch(() => {});

    return review;
  },
};

export default reviewService;

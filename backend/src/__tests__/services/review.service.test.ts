jest.mock("../../config/environment", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
    MINIO_BUCKET_PREFIX: "airbnb",
  },
}));

jest.mock("../../config/database", () => {
  const models = {
    booking: { findUnique: jest.fn() },
    review: { create: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  return {
    __esModule: true,
    default: models,
    prisma: models,
  };
});

jest.mock("../../utils/eventPublisher", () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

import { reviewService } from "../../modules/review/services/review.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const bookingFindUnique = prisma.booking.findUnique as jest.Mock;
const reviewCreate = prisma.review.create as jest.Mock;

const mockBooking = {
  id: "booking-1",
  userId: "user-1",
  status: "checked_out",
};

const reviewData = {
  bookingId: "booking-1",
  receiverId: "host-1",
  rating: 5,
  comment: "Great stay!",
};

describe("reviewService", () => {
  describe("createReview", () => {
    it("should create a review for a completed booking", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      const createdReview = {
        id: "review-1",
        ...reviewData,
        senderId: "user-1",
      };
      reviewCreate.mockResolvedValue(createdReview);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await reviewService.createReview("user-1", reviewData);

      expect(bookingFindUnique).toHaveBeenCalledWith({
        where: { id: "booking-1" },
      });
      expect(reviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderId: "user-1",
            receiverId: "host-1",
            rating: 5,
          }),
        }),
      );
      expect(result).toEqual(createdReview);
    });

    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        reviewService.createReview("user-1", reviewData),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when reviewer is not the booking guest", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      await expect(
        reviewService.createReview("other-user", reviewData),
      ).rejects.toThrow(
        new AppError("Only the booking guest can submit review", 403),
      );
    });

    it("should throw AppError(400) when booking status is not checked_out", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        status: "confirmed",
      });

      await expect(
        reviewService.createReview("user-1", reviewData),
      ).rejects.toThrow(
        new AppError("Review can only be submitted after check-out", 400),
      );
    });
  });
});

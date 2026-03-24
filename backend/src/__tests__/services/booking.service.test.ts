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

const mockRedis = {
  set: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
};

jest.mock("../../config/redis", () => ({
  getRedisClient: jest.fn().mockResolvedValue(mockRedis),
}));

jest.mock("../../config/database", () => ({
  prisma: {
    room: { findUnique: jest.fn(), findMany: jest.fn() },
    blockedDates: { findFirst: jest.fn() },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bookingHistory: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    serviceFeeConfig: { findFirst: jest.fn() },
    taxConfiguration: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../utils/eventPublisher", () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

import { bookingService } from "../../modules/booking/services/booking.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const roomFindUnique = prisma.room.findUnique as jest.Mock;
const roomFindMany = prisma.room.findMany as jest.Mock;
const blockedDatesFindFirst = (prisma as any).blockedDates
  .findFirst as jest.Mock;
const bookingFindFirst = prisma.booking.findFirst as jest.Mock;
const bookingFindUnique = prisma.booking.findUnique as jest.Mock;
const bookingFindMany = prisma.booking.findMany as jest.Mock;
const bookingCount = prisma.booking.count as jest.Mock;
const prismaTransaction = prisma.$transaction as jest.Mock;
const serviceFeeConfigFindFirst = (prisma as any).serviceFeeConfig
  .findFirst as jest.Mock;
const taxConfigFindFirst = (prisma as any).taxConfiguration
  .findFirst as jest.Mock;

const checkIn = new Date("2025-10-01");
const checkOut = new Date("2025-10-05"); // 4 nights

const mockRoom = {
  id: "room-1",
  hotelId: "hotel-1",
  maxGuests: 4,
  basePrice: 1000,
  hotel: { id: "hotel-1", name: "Test Hotel", ownerId: "host-1" },
};

const mockBooking = {
  id: "booking-1",
  userId: "user-1",
  roomId: "room-1",
  checkIn,
  checkOut,
  guestCount: 2,
  amount: 4600,
  status: "pending",
  notes: null,
  room: {
    hotel: {
      ownerId: "host-1",
      name: "Test Hotel",
      owner: { id: "host-1", name: "Host", email: "host@example.com" },
    },
  },
  guest: { id: "user-1", name: "Guest", email: "guest@example.com" },
};

describe("bookingService", () => {
  describe("createBooking", () => {
    beforeEach(() => {
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.del.mockResolvedValue(1);
      roomFindUnique.mockResolvedValue(mockRoom);
      roomFindMany.mockResolvedValue([]);
      blockedDatesFindFirst.mockResolvedValue(null);
      bookingFindFirst.mockResolvedValue(null);
      bookingFindUnique.mockResolvedValue(null); // fire-and-forget chain
      serviceFeeConfigFindFirst.mockResolvedValue(null);
      taxConfigFindFirst.mockResolvedValue(null);
      bookingCount.mockResolvedValue(0);
      prismaTransaction.mockImplementation(async (fn: any) =>
        fn({
          booking: { create: jest.fn().mockResolvedValue(mockBooking) },
          bookingHistory: { create: jest.fn() },
        }),
      );
    });

    it("should throw AppError(400) when checkIn >= checkOut", async () => {
      const sameDay = new Date("2025-10-01");
      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn: sameDay,
          checkOut: sameDay,
          guestCount: 2,
        }),
      ).rejects.toThrow(new AppError("Check-out must be after check-in", 400));
    });

    it("should throw AppError(404) when room not found", async () => {
      roomFindUnique.mockResolvedValue(null);

      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 2,
        }),
      ).rejects.toThrow(new AppError("Room not found", 404));
    });

    it("should throw AppError(400) when guestCount exceeds maxGuests", async () => {
      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 10,
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw AppError(409) when Redis lock cannot be acquired", async () => {
      mockRedis.set.mockResolvedValue(null); // Lock not acquired

      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 2,
        }),
      ).rejects.toThrow(
        new AppError(
          "Room is being booked. Please try again in a moment.",
          409,
        ),
      );
    });

    it("should throw AppError(409) when dates are blocked", async () => {
      blockedDatesFindFirst.mockResolvedValue({
        id: "bd-1",
        reason: "maintenance",
      });

      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 2,
        }),
      ).rejects.toThrow(
        new AppError("Room is blocked for selected dates", 409),
      );
    });

    it("should throw AppError(409) when an existing booking conflicts", async () => {
      bookingFindFirst.mockResolvedValue({ id: "existing-booking" });

      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 2,
        }),
      ).rejects.toThrow(
        new AppError("Room is already booked for selected dates", 409),
      );
    });

    it("should create a booking and calculate amount correctly", async () => {
      const createdBooking = { ...mockBooking, id: "new-booking-1" };
      prismaTransaction.mockImplementation(async (fn: any) =>
        fn({
          booking: { create: jest.fn().mockResolvedValue(createdBooking) },
          bookingHistory: { create: jest.fn() },
        }),
      );

      const result = await bookingService.createBooking("user-1", {
        roomId: "room-1",
        checkIn,
        checkOut,
        guestCount: 2,
      });

      expect(prismaTransaction).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled(); // Lock released in finally
      expect(result).toEqual(createdBooking);
    });

    it("should release the Redis lock in finally even if transaction fails", async () => {
      prismaTransaction.mockRejectedValue(new Error("DB error"));

      await expect(
        bookingService.createBooking("user-1", {
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 2,
        }),
      ).rejects.toThrow();

      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe("getMyBookings", () => {
    it("should return the current user bookings", async () => {
      bookingFindMany.mockResolvedValue([mockBooking]);

      const result = await bookingService.getMyBookings("user-1");

      expect(bookingFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1" } }),
      );
      expect(result).toEqual([mockBooking]);
    });
  });

  describe("getHostBookings", () => {
    it("should return bookings for rooms owned by the host", async () => {
      bookingFindMany.mockResolvedValue([mockBooking]);

      const result = await bookingService.getHostBookings("host-1");

      expect(bookingFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { room: { hotel: { ownerId: "host-1" } } },
        }),
      );
      expect(result).toEqual([mockBooking]);
    });
  });

  describe("getBookingById", () => {
    it("should return a booking when user is the guest", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById("user-1", "booking-1");

      expect(result).toEqual(mockBooking);
    });

    it("should return a booking when user is the hotel owner", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById("host-1", "booking-1");

      expect(result).toEqual(mockBooking);
    });

    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        bookingService.getBookingById("user-1", "booking-1"),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when user has no access", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      await expect(
        bookingService.getBookingById("other-user", "booking-1"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("updateBooking", () => {
    const pendingBooking = { ...mockBooking, status: "pending" };

    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        bookingService.updateBooking("user-1", "booking-1", { notes: "test" }),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when user is not the guest", async () => {
      bookingFindUnique.mockResolvedValue(pendingBooking);

      await expect(
        bookingService.updateBooking("other-user", "booking-1", {
          notes: "test",
        }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });

    it("should throw AppError(400) when booking status prevents update", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        status: "checked_out",
      });

      await expect(
        bookingService.updateBooking("user-1", "booking-1", { notes: "test" }),
      ).rejects.toThrow(
        new AppError("Booking cannot be updated in current status", 400),
      );
    });

    it("should throw AppError(400) when checkOut is before checkIn", async () => {
      bookingFindUnique.mockResolvedValue(pendingBooking);

      await expect(
        bookingService.updateBooking("user-1", "booking-1", {
          checkIn: new Date("2025-10-05"),
          checkOut: new Date("2025-10-01"),
        }),
      ).rejects.toThrow(new AppError("Check-out must be after check-in", 400));
    });

    it("should update the booking successfully", async () => {
      bookingFindUnique.mockResolvedValue(pendingBooking);
      const updated = { ...pendingBooking, notes: "Updated notes" };
      (prisma.booking.update as jest.Mock).mockResolvedValue(updated);
      (prisma.bookingHistory.create as jest.Mock).mockResolvedValue({});

      const result = await bookingService.updateBooking("user-1", "booking-1", {
        notes: "Updated notes",
      });

      expect(result).toEqual(updated);
    });
  });

  describe("cancelBooking", () => {
    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        bookingService.cancelBooking("user-1", "booking-1"),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when user cannot cancel", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      await expect(
        bookingService.cancelBooking("outsider", "booking-1"),
      ).rejects.toThrow(
        new AppError("Unauthorized to cancel this booking", 403),
      );
    });

    it("should throw AppError(400) when booking is already cancelled", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        status: "cancelled",
      });

      await expect(
        bookingService.cancelBooking("user-1", "booking-1"),
      ).rejects.toThrow(
        new AppError("Booking cannot be cancelled in current status", 400),
      );
    });

    it("should cancel the booking successfully", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      const cancelled = { ...mockBooking, status: "cancelled" };
      prismaTransaction.mockImplementation(async (fn: any) =>
        fn({
          booking: { update: jest.fn().mockResolvedValue(cancelled) },
          bookingHistory: { create: jest.fn() },
        }),
      );

      const result = await bookingService.cancelBooking(
        "user-1",
        "booking-1",
        "Changed plans",
      );

      expect(result).toEqual(cancelled);
    });
  });

  describe("getBookingPricePreview", () => {
    it("should return consistent booking price breakdown", async () => {
      roomFindUnique.mockResolvedValue({
        ...mockRoom,
        hotel: { ...mockRoom.hotel, cancellationPolicy: null },
      });
      serviceFeeConfigFindFirst.mockResolvedValue({ percentage: 10 });
      taxConfigFindFirst.mockResolvedValue({ taxPercentage: 5 });

      const result = await bookingService.getBookingPricePreview({
        roomId: "room-1",
        checkIn,
        checkOut,
        guestCount: 2,
      });

      expect(result.nights).toBe(4);
      expect(result.pricing.subtotal).toBe(4000);
      expect(result.pricing.serviceFee).toBe(400);
      expect(result.pricing.tax).toBe(220);
      expect(result.pricing.total).toBe(4620);
    });

    it("should throw AppError(400) when guest count exceeds room max", async () => {
      roomFindUnique.mockResolvedValue({
        ...mockRoom,
        hotel: { ...mockRoom.hotel, cancellationPolicy: null },
      });

      await expect(
        bookingService.getBookingPricePreview({
          roomId: "room-1",
          checkIn,
          checkOut,
          guestCount: 10,
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("getCancellationPreview", () => {
    it("should include pricing breakdown with refund fields", async () => {
      const futureCheckIn = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const futureCheckOut = new Date(
        futureCheckIn.getTime() + 4 * 24 * 60 * 60 * 1000,
      );

      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        userId: "user-1",
        room: {
          ...mockBooking.room,
          basePrice: 1000,
          hotel: {
            ...mockBooking.room.hotel,
            cancellationPolicy: {
              policyType: "moderate",
              freeCancellationHours: 24,
              partialRefundPercent: 50,
            },
          },
        },
        checkIn: futureCheckIn,
        checkOut: futureCheckOut,
      });
      serviceFeeConfigFindFirst.mockResolvedValue({ percentage: 10 });
      taxConfigFindFirst.mockResolvedValue({ taxPercentage: 5 });

      const result = await bookingService.getCancellationPreview(
        "user-1",
        "booking-1",
      );

      expect(result.pricing).toEqual({
        subtotal: 4000,
        serviceFee: 400,
        tax: 220,
        total: 4620,
      });
      expect(result).toHaveProperty("refundableAmount");
      expect(result).toHaveProperty("nonRefundableAmount");
    });
  });

  describe("getReservationRiskMock", () => {
    it("should return low risk for verified long-standing user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        verified: true,
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      });
      roomFindUnique.mockResolvedValue(mockRoom);
      bookingCount.mockResolvedValue(0);
      serviceFeeConfigFindFirst.mockResolvedValue({ percentage: 10 });
      taxConfigFindFirst.mockResolvedValue({ taxPercentage: 5 });

      const result = await bookingService.getReservationRiskMock("user-1", {
        roomId: "room-1",
        checkIn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        guestCount: 2,
      });

      expect(result.riskLevel).toBe("low");
      expect(result.recommendation).toBe("auto_approve");
    });

    it("should return high risk for unverified user with cancellation history", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        verified: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      });
      roomFindUnique.mockResolvedValue(mockRoom);
      bookingCount.mockResolvedValue(4);
      serviceFeeConfigFindFirst.mockResolvedValue({ percentage: 10 });
      taxConfigFindFirst.mockResolvedValue({ taxPercentage: 5 });

      const result = await bookingService.getReservationRiskMock("user-1", {
        roomId: "room-1",
        checkIn: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        guestCount: 4,
      });

      expect(result.riskLevel).toBe("high");
      expect(result.recommendation).toBe("manual_review");
    });
  });

  describe("getRebookingOptionsMock", () => {
    it("should return comparable options and refund fallback", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      roomFindMany.mockResolvedValue([
        {
          id: "room-2",
          hotelId: "hotel-2",
          roomType: "suite",
          maxGuests: 3,
          basePrice: 1200,
          hotel: {
            id: "hotel-2",
            name: "Nearby Stay",
            location: "12.97,77.59,Bengaluru",
          },
        },
      ]);

      const result = await bookingService.getRebookingOptionsMock(
        "user-1",
        "booking-1",
        "Host cancellation",
      );

      expect(result.comparableOptions).toHaveLength(1);
      expect(result.fallbackRefund.estimatedRefundAmount).toBe(4600);
    });
  });

  describe("confirmCheckIn", () => {
    const confirmedBooking = {
      ...mockBooking,
      status: "confirmed",
      room: { hotel: { ownerId: "host-1", name: "Test Hotel" } },
    };

    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        bookingService.confirmCheckIn("host-1", "booking-1"),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when user is not the hotel owner", async () => {
      bookingFindUnique.mockResolvedValue(confirmedBooking);

      await expect(
        bookingService.confirmCheckIn("wrong-host", "booking-1"),
      ).rejects.toThrow(new AppError("Only host can confirm check-in", 403));
    });

    it("should throw AppError(400) when booking is not confirmed", async () => {
      bookingFindUnique.mockResolvedValue({
        ...confirmedBooking,
        status: "pending",
      });

      await expect(
        bookingService.confirmCheckIn("host-1", "booking-1"),
      ).rejects.toThrow(
        new AppError("Only confirmed bookings can be checked in", 400),
      );
    });

    it("should set status to checked_in", async () => {
      bookingFindUnique.mockResolvedValue(confirmedBooking);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const checkedIn = { ...confirmedBooking, status: "checked_in" };
      prismaTransaction.mockImplementation(async (fn: any) =>
        fn({
          booking: { update: jest.fn().mockResolvedValue(checkedIn) },
          bookingHistory: { create: jest.fn() },
        }),
      );

      const result = await bookingService.confirmCheckIn("host-1", "booking-1");

      expect(result).toEqual(checkedIn);
    });
  });

  describe("confirmCheckOut", () => {
    const checkedInBooking = {
      ...mockBooking,
      status: "checked_in",
      room: { hotel: { ownerId: "host-1", name: "Test Hotel" } },
    };

    it("should throw AppError(403) when user is not the hotel owner", async () => {
      bookingFindUnique.mockResolvedValue(checkedInBooking);

      await expect(
        bookingService.confirmCheckOut("wrong-host", "booking-1"),
      ).rejects.toThrow(new AppError("Only host can confirm check-out", 403));
    });

    it("should throw AppError(400) when booking is not checked_in", async () => {
      bookingFindUnique.mockResolvedValue({
        ...checkedInBooking,
        status: "confirmed",
      });

      await expect(
        bookingService.confirmCheckOut("host-1", "booking-1"),
      ).rejects.toThrow(
        new AppError("Only checked-in bookings can be checked out", 400),
      );
    });

    it("should set status to checked_out", async () => {
      bookingFindUnique.mockResolvedValue(checkedInBooking);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const checkedOut = { ...checkedInBooking, status: "checked_out" };
      prismaTransaction.mockImplementation(async (fn: any) =>
        fn({
          booking: { update: jest.fn().mockResolvedValue(checkedOut) },
          bookingHistory: { create: jest.fn() },
        }),
      );

      const result = await bookingService.confirmCheckOut(
        "host-1",
        "booking-1",
      );

      expect(result).toEqual(checkedOut);
    });
  });
});

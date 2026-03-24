jest.mock("../../config/environment", () => ({
  env: {
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    MINIO_BUCKET_PREFIX: "airbnb",
    JWT_SECRET: "test_jwt_secret",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
  },
}));

const mockMinioClient = {
  putObject: jest.fn(),
  presignedPutObject: jest.fn(),
  removeObject: jest.fn(),
};

jest.mock("../../config/minio", () => ({
  getMinioClient: jest.fn().mockReturnValue(mockMinioClient),
}));

jest.mock("../../config/database", () => ({
  prisma: {
    hotel: { findUnique: jest.fn() },
    room: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    blockedDates: { findMany: jest.fn() },
    booking: { findFirst: jest.fn() },
    taxConfiguration: { findFirst: jest.fn() },
  },
}));

import { roomService, calculatePricing } from "../../modules/room/services/room.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const hotelFindUnique = prisma.hotel.findUnique as jest.Mock;
const roomFindUnique = prisma.room.findUnique as jest.Mock;
const roomCreate = prisma.room.create as jest.Mock;
const roomUpdate = prisma.room.update as jest.Mock;
const roomDelete = prisma.room.delete as jest.Mock;
const blockedDatesFindMany = prisma.blockedDates.findMany as jest.Mock;
const bookingFindFirst = prisma.booking.findFirst as jest.Mock;
const taxConfigFindFirst = prisma.taxConfiguration.findFirst as jest.Mock;

const mockHotel = { id: "hotel-1", ownerId: "host-1", name: "Test Hotel" };
const mockRoom = {
  id: "room-1",
  hotelId: "hotel-1",
  roomType: "deluxe",
  capacity: 2,
  maxGuests: 4,
  basePrice: 1000,
  amenities: "[]",
  images: "[]",
  hotel: mockHotel,
};

describe("calculatePricing", () => {
  it("should calculate total with default tax and service fee", () => {
    // 4 nights × ₹1000 = ₹4000 subtotal
    // Service fee: 4000 × 13% = ₹520 (well below 30% cap of ₹1200)
    // Tax: (4000 + 520) × 5% = ₹226
    // Total = 4000 + 520 + 226 = 4746
    const result = calculatePricing(1000, 4);

    expect(result.basePrice).toBe(1000);
    expect(result.nights).toBe(4);
    expect(result.cleaningFee).toBe(0);
    expect(result.subtotal).toBe(4000);
    expect(result.serviceCharge).toBeCloseTo(520);
    expect(result.taxes).toBeCloseTo(226);
    expect(result.total).toBeCloseTo(4746);
  });

  it("should cap service fee at 30% of subtotal", () => {
    // Using serviceFeePercent = 50 — should be capped at 30%
    const result = calculatePricing(1000, 2, 0, 0.05, 50);

    expect(result.serviceCharge).toBe(result.subtotal * 0.3);
  });

  it("should include cleaning fee in the subtotal", () => {
    const result = calculatePricing(1000, 2, 200);

    expect(result.subtotal).toBe(2200); // (1000 × 2) + 200
  });

  it("should apply custom tax rate", () => {
    const result = calculatePricing(1000, 1, 0, 0.12);

    const expected = 1000 * 1;
    const serviceFee = expected * 0.13;
    const taxes = (expected + serviceFee) * 0.12;
    expect(result.taxes).toBeCloseTo(taxes);
  });
});

describe("roomService", () => {
  describe("createRoom", () => {
    it("should create a room when the owner is valid", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);
      roomCreate.mockResolvedValue(mockRoom);

      const result = await roomService.createRoom("hotel-1", "host-1", {
        roomType: "deluxe",
        capacity: 2,
        maxGuests: 4,
        basePrice: 1000,
      });

      expect(hotelFindUnique).toHaveBeenCalledWith({
        where: { id: "hotel-1" },
      });
      expect(roomCreate).toHaveBeenCalled();
      expect(result).toEqual(mockRoom);
    });

    it("should throw AppError(403) when hotel not found", async () => {
      hotelFindUnique.mockResolvedValue(null);

      await expect(
        roomService.createRoom("hotel-1", "host-1", {
          roomType: "standard",
          capacity: 2,
          maxGuests: 2,
          basePrice: 500,
        }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });

    it("should throw AppError(403) when user is not the hotel owner", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);

      await expect(
        roomService.createRoom("hotel-1", "wrong-host", {
          roomType: "standard",
          capacity: 2,
          maxGuests: 2,
          basePrice: 500,
        }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("getRoomById", () => {
    it("should return the room when found", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);

      const result = await roomService.getRoomById("room-1");

      expect(result).toEqual(mockRoom);
    });

    it("should throw AppError(404) when room not found", async () => {
      roomFindUnique.mockResolvedValue(null);

      await expect(roomService.getRoomById("nonexistent")).rejects.toThrow(
        new AppError("Room not found", 404),
      );
    });
  });

  describe("checkAvailability", () => {
    const checkIn = new Date("2025-10-01");
    const checkOut = new Date("2025-10-05");

    it("should return isAvailable: true when no conflicts", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      blockedDatesFindMany.mockResolvedValue([]);
      bookingFindFirst.mockResolvedValue(null);

      const result = await roomService.checkAvailability(
        "room-1",
        checkIn,
        checkOut,
      );

      expect(result).toEqual({ isAvailable: true });
    });

    it("should return isAvailable: false when dates are blocked", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      blockedDatesFindMany.mockResolvedValue([
        { id: "bd-1", reason: "maintenance" },
      ]);

      const result = await roomService.checkAvailability(
        "room-1",
        checkIn,
        checkOut,
      );

      expect(result).toEqual({
        isAvailable: false,
        reason: "Room is blocked for these dates",
      });
    });

    it("should return isAvailable: false when an existing booking conflicts", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      blockedDatesFindMany.mockResolvedValue([]);
      bookingFindFirst.mockResolvedValue({ id: "booking-1" });

      const result = await roomService.checkAvailability(
        "room-1",
        checkIn,
        checkOut,
      );

      expect(result).toEqual({
        isAvailable: false,
        reason: "Room is already booked",
      });
    });

    it("should throw AppError(404) when room not found", async () => {
      roomFindUnique.mockResolvedValue(null);

      await expect(
        roomService.checkAvailability("nonexistent", checkIn, checkOut),
      ).rejects.toThrow(new AppError("Room not found", 404));
    });
  });

  describe("getPricing", () => {
    it("should return pricing with default tax when no tax config found", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      taxConfigFindFirst.mockResolvedValue(null);

      const result = await roomService.getPricing("room-1", {
        checkIn: new Date("2025-10-01"),
        checkOut: new Date("2025-10-04"), // 3 nights
      });

      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(1000);
      expect(result.currency).toBe("INR");
    });

    it("should apply tax from configuration when available", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      taxConfigFindFirst.mockResolvedValue({ taxPercentage: 12 });

      const result = await roomService.getPricing("room-1", {
        checkIn: new Date("2025-10-01"),
        checkOut: new Date("2025-10-02"), // 1 night
      });

      const subtotal = 1000;
      const serviceCharge = subtotal * 0.13;
      const expectedTax = (subtotal + serviceCharge) * 0.12;
      expect(result.taxes).toBeCloseTo(expectedTax);
    });

    it("should throw AppError(400) when check-out is not after check-in", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      taxConfigFindFirst.mockResolvedValue(null);

      await expect(
        roomService.getPricing("room-1", {
          checkIn: new Date("2025-10-05"),
          checkOut: new Date("2025-10-01"),
        }),
      ).rejects.toThrow(new AppError("Check-out must be after check-in", 400));
    });

    it("should throw AppError(404) when room not found", async () => {
      roomFindUnique.mockResolvedValue(null);

      await expect(
        roomService.getPricing("nonexistent", {
          checkIn: new Date("2025-10-01"),
          checkOut: new Date("2025-10-03"),
        }),
      ).rejects.toThrow(new AppError("Room not found", 404));
    });
  });

  describe("uploadImage", () => {
    it("should upload image to MinIO and update room record", async () => {
      roomFindUnique.mockResolvedValue({ ...mockRoom, images: "[]" });
      mockMinioClient.putObject.mockResolvedValue(undefined);
      roomUpdate.mockResolvedValue({
        ...mockRoom,
        images: '[{"key":"test","url":"http://test"}]',
      });

      const buffer = Buffer.from("fake-image");
      const result = await roomService.uploadImage(
        "room-1",
        "host-1",
        "photo.jpg",
        buffer,
      );

      expect(mockMinioClient.putObject).toHaveBeenCalled();
      expect(roomUpdate).toHaveBeenCalled();
      expect(result.imageUrl).toContain("airbnb-room-images");
    });

    it("should throw AppError(403) when user is not the room owner", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);

      await expect(
        roomService.uploadImage(
          "room-1",
          "wrong-host",
          "photo.jpg",
          Buffer.from(""),
        ),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("deleteRoom", () => {
    it("should delete the room when owner is valid", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      roomDelete.mockResolvedValue(mockRoom);

      const result = await roomService.deleteRoom("room-1", "host-1");

      expect(roomDelete).toHaveBeenCalledWith({ where: { id: "room-1" } });
      expect(result).toEqual({ message: "Room deleted successfully" });
    });

    it("should throw AppError(403) when user is not the owner", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);

      await expect(
        roomService.deleteRoom("room-1", "wrong-host"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });
});

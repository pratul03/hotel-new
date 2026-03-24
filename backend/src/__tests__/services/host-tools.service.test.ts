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

jest.mock("../../config/database", () => ({
  prisma: {
    hotel: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    coHostAssignment: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
    room: {
      count: jest.fn(),
    },
  },
}));

import { hostToolsService } from "../../modules/host-tools/services/host-tools.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const hotelFindUnique = prisma.hotel.findUnique as jest.Mock;
const userFindUnique = prisma.user.findUnique as jest.Mock;
const cohostFindMany = prisma.coHostAssignment.findMany as jest.Mock;
const cohostUpsert = prisma.coHostAssignment.upsert as jest.Mock;
const bookingFindMany = prisma.booking.findMany as jest.Mock;
const reviewAggregate = prisma.review.aggregate as jest.Mock;
const roomCount = prisma.room.count as jest.Mock;

describe("hostToolsService.addCoHost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hotelFindUnique.mockResolvedValue({ id: "hotel-1", ownerId: "host-1" });
    userFindUnique.mockResolvedValue({ id: "cohost-1", role: "host" });
    cohostFindMany.mockResolvedValue([]);
    cohostUpsert.mockResolvedValue({ id: "assignment-1" });
  });

  it("should add co-host with normalized permission set", async () => {
    const result = await hostToolsService.addCoHost("hotel-1", "host-1", {
      cohostUserId: "cohost-1",
      permissions: ["Messaging", "calendar", "messaging"],
      revenueSplitPercent: 30,
    });

    expect(cohostUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          permissions: JSON.stringify(["messaging", "calendar"]),
          revenueSplitPercent: 30,
        }),
      }),
    );
    expect(result).toEqual({ id: "assignment-1" });
  });

  it("should throw when invalid permission is provided", async () => {
    await expect(
      hostToolsService.addCoHost("hotel-1", "host-1", {
        cohostUserId: "cohost-1",
        permissions: ["messaging", "billing"],
      }),
    ).rejects.toThrow(new AppError("Invalid co-host permission: billing", 400));
  });

  it("should throw when cumulative split exceeds 100", async () => {
    cohostFindMany.mockResolvedValue([
      { cohostUserId: "cohost-2", revenueSplitPercent: 80 },
    ]);

    await expect(
      hostToolsService.addCoHost("hotel-1", "host-1", {
        cohostUserId: "cohost-1",
        permissions: ["messaging"],
        revenueSplitPercent: 30,
      }),
    ).rejects.toThrow(
      new AppError("Total co-host revenue split cannot exceed 100%", 400),
    );
  });

  it("should throw when co-host cap is reached for new assignment", async () => {
    cohostFindMany.mockResolvedValue([
      { cohostUserId: "a", revenueSplitPercent: 10 },
      { cohostUserId: "b", revenueSplitPercent: 10 },
      { cohostUserId: "c", revenueSplitPercent: 10 },
      { cohostUserId: "d", revenueSplitPercent: 10 },
      { cohostUserId: "e", revenueSplitPercent: 10 },
    ]);

    await expect(
      hostToolsService.addCoHost("hotel-1", "host-1", {
        cohostUserId: "cohost-1",
        permissions: ["messaging"],
      }),
    ).rejects.toThrow(new AppError("Maximum co-host assignments reached", 400));
  });
});

describe("hostToolsService.getAnalytics", () => {
  it("should include daily snapshots for dashboard consumption", async () => {
    bookingFindMany.mockResolvedValue([
      {
        id: "b1",
        status: "confirmed",
        amount: 2000,
        checkIn: new Date("2026-03-20"),
        checkOut: new Date("2026-03-22"),
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      },
      {
        id: "b2",
        status: "cancelled",
        amount: 1000,
        checkIn: new Date("2026-03-21"),
        checkOut: new Date("2026-03-22"),
        createdAt: new Date("2026-03-01T11:00:00.000Z"),
      },
      {
        id: "b3",
        status: "checked_out",
        amount: 4000,
        checkIn: new Date("2026-03-22"),
        checkOut: new Date("2026-03-24"),
        createdAt: new Date("2026-03-02T09:00:00.000Z"),
      },
    ]);
    reviewAggregate.mockResolvedValue({
      _avg: { rating: 4.7 },
      _count: { rating: 12 },
    });
    roomCount.mockResolvedValue(2);

    const result = await hostToolsService.getAnalytics("host-1", 30);

    expect(result.dailySnapshots).toEqual([
      {
        date: "2026-03-01",
        bookings: 2,
        confirmed: 1,
        revenue: 2000,
      },
      {
        date: "2026-03-02",
        bookings: 1,
        confirmed: 0,
        revenue: 4000,
      },
    ]);
  });
});

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
    user: { findUnique: jest.fn() },
    hotel: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    room: { findMany: jest.fn() },
    blockedDates: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { hotelService } from "../../domains/hotel/services/hotel.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const userFindUnique = prisma.user.findUnique as jest.Mock;
const hotelFindUnique = prisma.hotel.findUnique as jest.Mock;
const hotelFindMany = prisma.hotel.findMany as jest.Mock;
const hotelCreate = prisma.hotel.create as jest.Mock;
const hotelUpdate = prisma.hotel.update as jest.Mock;
const hotelDelete = prisma.hotel.delete as jest.Mock;
const roomFindMany = prisma.room.findMany as jest.Mock;
const blockedDatesCreate = prisma.blockedDates.create as jest.Mock;
const blockedDatesFindMany = prisma.blockedDates.findMany as jest.Mock;

const mockOwner = { id: "host-1", role: "host", name: "Host User" };
const mockHotel = {
  id: "hotel-1",
  ownerId: "host-1",
  name: "Test Hotel",
  location: "12.9716,77.5946,Bengaluru Karnataka India",
  amenities: "[]",
  rooms: [],
  owner: {
    id: "host-1",
    name: "Host User",
    avatar: null,
    superhost: false,
    responseRate: null,
  },
};

const validHotelData = {
  name: "Test Hotel",
  location: "12.9716,77.5946,Bengaluru Karnataka India",
};

describe("hotelService", () => {
  describe("createHotel", () => {
    it("should create a hotel for a host user", async () => {
      userFindUnique.mockResolvedValue(mockOwner);
      hotelCreate.mockResolvedValue(mockHotel);

      const result = await hotelService.createHotel("host-1", validHotelData);

      expect(userFindUnique).toHaveBeenCalledWith({ where: { id: "host-1" } });
      expect(hotelCreate).toHaveBeenCalled();
      expect(result).toEqual(mockHotel);
    });

    it("should throw AppError(404) when owner user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(
        hotelService.createHotel("host-1", validHotelData),
      ).rejects.toThrow(new AppError("Owner user not found", 404));
    });

    it("should throw AppError(403) when user is not host or admin", async () => {
      userFindUnique.mockResolvedValue({ ...mockOwner, role: "guest" });

      await expect(
        hotelService.createHotel("host-1", validHotelData),
      ).rejects.toThrow(
        new AppError("User must have host role to create hotels", 403),
      );
    });

    it("should allow admin to create a hotel", async () => {
      userFindUnique.mockResolvedValue({ ...mockOwner, role: "admin" });
      hotelCreate.mockResolvedValue(mockHotel);

      const result = await hotelService.createHotel("host-1", validHotelData);

      expect(result).toEqual(mockHotel);
    });

    it("should throw AppError(400) when location has fewer than 3 parts", async () => {
      userFindUnique.mockResolvedValue(mockOwner);

      await expect(
        hotelService.createHotel("host-1", {
          name: "Test",
          location: "12.97,77.59",
        }),
      ).rejects.toThrow(
        new AppError(
          "Location must be in format: latitude,longitude,address",
          400,
        ),
      );
    });
  });

  describe("getHotelById", () => {
    it("should return the hotel when found", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);

      const result = await hotelService.getHotelById("hotel-1");

      expect(result).toEqual(mockHotel);
    });

    it("should throw AppError(404) when hotel not found", async () => {
      hotelFindUnique.mockResolvedValue(null);

      await expect(hotelService.getHotelById("nonexistent")).rejects.toThrow(
        new AppError("Hotel not found", 404),
      );
    });
  });

  describe("searchHotels", () => {
    // Hotels in Bengaluru area (lat ~12.97, lon ~77.59)
    const bengaluruHotel = {
      ...mockHotel,
      location: "12.9716,77.5946,Bengaluru",
      rooms: [{ maxGuests: 4 }],
      owner: { id: "host-1", superhost: false, responseRate: 80 },
    };
    const distantHotel = {
      id: "hotel-2",
      ownerId: "host-2",
      name: "Distant Hotel",
      location: "28.6139,77.2090,New Delhi", // ~1700km away
      rooms: [{ maxGuests: 2 }],
      owner: { id: "host-2", superhost: true, responseRate: 95 },
    };

    it("should return only hotels within the specified radius", async () => {
      hotelFindMany.mockResolvedValue([bengaluruHotel, distantHotel]);

      const result = await hotelService.searchHotels({
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 50,
        guests: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("hotel-1");
    });

    it("should filter out hotels that cannot accommodate the requested guests", async () => {
      const smallRoomHotel = { ...bengaluruHotel, rooms: [{ maxGuests: 1 }] };
      hotelFindMany.mockResolvedValue([smallRoomHotel]);

      const result = await hotelService.searchHotels({
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 50,
        guests: 4,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should paginate results correctly", async () => {
      const hotels = Array.from({ length: 15 }, (_, i) => ({
        ...bengaluruHotel,
        id: `hotel-${i}`,
        location: "12.9716,77.5946,Bengaluru",
        rooms: [{ maxGuests: 4 }],
      }));
      hotelFindMany.mockResolvedValue(hotels);

      const result = await hotelService.searchHotels({
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 50,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(10);
      expect(result.pagination.total).toBe(15);
      expect(result.pagination.pages).toBe(2);
    });

    it("should sort superhosts first", async () => {
      const regularHost = {
        ...bengaluruHotel,
        id: "regular",
        owner: { id: "h1", superhost: false, responseRate: 90 },
      };
      const superHost = {
        ...bengaluruHotel,
        id: "super",
        owner: { id: "h2", superhost: true, responseRate: 50 },
      };
      hotelFindMany.mockResolvedValue([regularHost, superHost]);

      const result = await hotelService.searchHotels({
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 50,
      });

      expect(result.data[0].id).toBe("super");
      expect(result.data[0].ranking).toBeDefined();
      expect(result.data[0].ranking.weights).toEqual({
        quality: 0.45,
        popularity: 0.25,
        locationPersonalization: 0.2,
        price: 0.1,
      });
      expect(result.data[0].ranking.factors).toHaveProperty("quality");
      expect(result.data[0].ranking.signals).toHaveProperty("price");
    });

    it("should omit ranking payload for non-recommended sorts", async () => {
      hotelFindMany.mockResolvedValue([bengaluruHotel]);

      const result = await hotelService.searchHotels({
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 50,
        sortBy: "price_asc",
      });

      expect(result.data[0].ranking).toBeUndefined();
    });
  });

  describe("updateHotel", () => {
    it("should update hotel when owner is correct", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);
      const updated = { ...mockHotel, name: "Updated Hotel" };
      hotelUpdate.mockResolvedValue(updated);

      const result = await hotelService.updateHotel("hotel-1", "host-1", {
        name: "Updated Hotel",
      });

      expect(result).toEqual(updated);
    });

    it("should throw AppError(403) when hotel not found", async () => {
      hotelFindUnique.mockResolvedValue(null);

      await expect(
        hotelService.updateHotel("hotel-1", "host-1", { name: "Updated" }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });

    it("should throw AppError(403) when user is not the owner", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);

      await expect(
        hotelService.updateHotel("hotel-1", "wrong-host", { name: "Updated" }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("deleteHotel", () => {
    it("should delete the hotel when owner is correct", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);
      hotelDelete.mockResolvedValue(mockHotel);

      const result = await hotelService.deleteHotel("hotel-1", "host-1");

      expect(hotelDelete).toHaveBeenCalledWith({ where: { id: "hotel-1" } });
      expect(result).toEqual({ message: "Hotel deleted successfully" });
    });

    it("should throw AppError(403) when user is not the owner", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);

      await expect(
        hotelService.deleteHotel("hotel-1", "wrong-host"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("blockDates", () => {
    it("should create blocked date records for all rooms in the hotel", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);
      roomFindMany.mockResolvedValue([{ id: "room-1" }, { id: "room-2" }]);
      blockedDatesCreate.mockResolvedValue({});

      await hotelService.blockDates("hotel-1", "host-1", {
        startDate: new Date("2025-11-01"),
        endDate: new Date("2025-11-15"),
        reason: "Renovation",
      });

      expect(blockedDatesCreate).toHaveBeenCalledTimes(2);
    });

    it("should throw AppError(403) when user is not the owner", async () => {
      hotelFindUnique.mockResolvedValue(mockHotel);

      await expect(
        hotelService.blockDates("hotel-1", "wrong-host", {
          startDate: new Date(),
          endDate: new Date(),
          reason: "test",
        }),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("getBlockedDates", () => {
    it("should return blocked dates for a hotel", async () => {
      const blockedDates = [
        { id: "bd-1", startDate: new Date(), endDate: new Date() },
      ];
      hotelFindUnique.mockResolvedValue(mockHotel);
      blockedDatesFindMany.mockResolvedValue(blockedDates);

      const result = await hotelService.getBlockedDates("hotel-1");

      expect(result).toEqual(blockedDates);
    });

    it("should throw AppError(404) when hotel not found", async () => {
      hotelFindUnique.mockResolvedValue(null);

      await expect(hotelService.getBlockedDates("nonexistent")).rejects.toThrow(
        new AppError("Hotel not found", 404),
      );
    });
  });
});

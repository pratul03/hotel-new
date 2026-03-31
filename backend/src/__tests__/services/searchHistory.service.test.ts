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
    searchHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { searchHistoryService } from "../../domains/search-history/services/search-history.service";
import { prisma } from "../../config/database";

const historyCreate = prisma.searchHistory.create as jest.Mock;
const historyFindMany = prisma.searchHistory.findMany as jest.Mock;
const historyDeleteMany = prisma.searchHistory.deleteMany as jest.Mock;

describe("searchHistoryService", () => {
  describe("add", () => {
    it("should add a search history entry", async () => {
      const mockEntry = {
        id: "sh-1",
        userId: "user-1",
        queryLocation: "Bengaluru",
        guests: 2,
        createdAt: new Date(),
      };
      historyCreate.mockResolvedValue(mockEntry);

      const result = await searchHistoryService.add("user-1", {
        queryLocation: "Bengaluru",
        guests: 2,
      });

      expect(historyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            queryLocation: "Bengaluru",
            guests: 2,
          }),
        }),
      );
      expect(result).toEqual(mockEntry);
    });

    it("should default guests to 1 when not provided", async () => {
      historyCreate.mockResolvedValue({});

      await searchHistoryService.add("user-1", { queryLocation: "Mumbai" });

      expect(historyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ guests: 1 }),
        }),
      );
    });
  });

  describe("list", () => {
    it("should return search history ordered by createdAt desc", async () => {
      const entries = [{ id: "sh-2" }, { id: "sh-1" }];
      historyFindMany.mockResolvedValue(entries);

      const result = await searchHistoryService.list("user-1");

      expect(historyFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(entries);
    });
  });

  describe("clear", () => {
    it("should delete all search history for the user", async () => {
      historyDeleteMany.mockResolvedValue({ count: 3 });

      const result = await searchHistoryService.clear("user-1");

      expect(historyDeleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(result).toEqual({ cleared: true });
    });
  });
});

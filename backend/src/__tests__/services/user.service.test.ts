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
    user: { findUnique: jest.fn(), update: jest.fn() },
    booking: { findMany: jest.fn() },
    searchHistory: { count: jest.fn() },
    userDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    hostVerification: { findUnique: jest.fn() },
  },
}));

import { userService } from "../../modules/users/services/users.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const userFindUnique = prisma.user.findUnique as jest.Mock;
const userUpdate = prisma.user.update as jest.Mock;
const bookingFindMany = prisma.booking.findMany as jest.Mock;
const searchHistoryCount = prisma.searchHistory.count as jest.Mock;
const userDocCreate = prisma.userDocument.create as jest.Mock;
const userDocFindMany = prisma.userDocument.findMany as jest.Mock;
const userDocFindUnique = prisma.userDocument.findUnique as jest.Mock;
const userDocDelete = prisma.userDocument.delete as jest.Mock;
const hostVerificationFindUnique = prisma.hostVerification
  .findUnique as jest.Mock;

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatar: null,
  role: "guest",
  verified: true,
  superhost: false,
  responseRate: null,
  createdAt: new Date(),
};

describe("userService", () => {
  describe("getProfile", () => {
    it("should return the user profile", async () => {
      userFindUnique.mockResolvedValue(mockUser);

      const result = await userService.getProfile("user-1");

      expect(userFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw AppError(404) when user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(userService.getProfile("nonexistent")).rejects.toThrow(
        new AppError("User not found", 404),
      );
    });
  });

  describe("updateProfile", () => {
    it("should update name and avatar", async () => {
      const updated = { ...mockUser, name: "New Name" };
      userUpdate.mockResolvedValue(updated);

      const result = await userService.updateProfile("user-1", {
        name: "New Name",
      });

      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe("addDocument", () => {
    it("should create a user document", async () => {
      const mockDoc = {
        id: "doc-1",
        userId: "user-1",
        documentType: "passport",
        docUrl: "http://doc.url",
      };
      userDocCreate.mockResolvedValue(mockDoc);

      const result = await userService.addDocument(
        "user-1",
        "passport",
        "http://doc.url",
      );

      expect(userDocCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          documentType: "passport",
          docUrl: "http://doc.url",
        },
      });
      expect(result).toEqual(mockDoc);
    });
  });

  describe("listDocuments", () => {
    it("should list user documents ordered by createdAt desc", async () => {
      const docs = [{ id: "doc-1" }, { id: "doc-2" }];
      userDocFindMany.mockResolvedValue(docs);

      const result = await userService.listDocuments("user-1");

      expect(userDocFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(docs);
    });
  });

  describe("deleteDocument", () => {
    it("should delete the document when it belongs to the user", async () => {
      userDocFindUnique.mockResolvedValue({ id: "doc-1", userId: "user-1" });
      userDocDelete.mockResolvedValue({});

      const result = await userService.deleteDocument("user-1", "doc-1");

      expect(userDocDelete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
      expect(result).toEqual({ deleted: true });
    });

    it("should throw AppError(404) when document not found", async () => {
      userDocFindUnique.mockResolvedValue(null);

      await expect(
        userService.deleteDocument("user-1", "nonexistent"),
      ).rejects.toThrow(new AppError("Document not found", 404));
    });

    it("should throw AppError(404) when document belongs to another user", async () => {
      userDocFindUnique.mockResolvedValue({
        id: "doc-1",
        userId: "other-user",
      });

      await expect(
        userService.deleteDocument("user-1", "doc-1"),
      ).rejects.toThrow(new AppError("Document not found", 404));
    });
  });

  describe("getHostVerification", () => {
    it("should return the host verification record", async () => {
      const mockVerification = {
        id: "hv-1",
        userId: "user-1",
        status: "approved",
        user: mockUser,
      };
      hostVerificationFindUnique.mockResolvedValue(mockVerification);

      const result = await userService.getHostVerification("user-1");

      expect(result).toEqual(mockVerification);
    });

    it("should throw AppError(404) when verification record not found", async () => {
      hostVerificationFindUnique.mockResolvedValue(null);

      await expect(userService.getHostVerification("user-1")).rejects.toThrow(
        new AppError("Host verification record not found", 404),
      );
    });
  });

  describe("getLoyaltySummary", () => {
    it("should return Platinum tier with null next tier target", async () => {
      bookingFindMany.mockResolvedValue(
        Array.from({ length: 20 }, () => ({ amount: 10000 })),
      );
      searchHistoryCount.mockResolvedValue(12);

      const result = await userService.getLoyaltySummary("user-1");

      expect(result.tier).toBe("Platinum");
      expect(result.nextTierTarget).toBeNull();
      expect(result.benefits).toContain("Top-tier support");
    });

    it("should compute next tier requirements for lower tiers", async () => {
      bookingFindMany.mockResolvedValue([{ amount: 5000 }, { amount: 4000 }]);
      searchHistoryCount.mockResolvedValue(3);

      const result = await userService.getLoyaltySummary("user-1");

      expect(result.tier).toBe("Explorer");
      expect(result.nextTierTarget).toEqual({
        tier: "Silver",
        staysRequired: 3,
        spendRequired: 16000,
      });
    });
  });

  describe("getIdentityVerificationMock", () => {
    it("should return in_review stage with required actions", async () => {
      userFindUnique.mockResolvedValue({ id: "user-1", verified: false });
      userDocFindMany.mockResolvedValue([
        {
          id: "doc-1",
          documentType: "passport",
          status: "pending",
          createdAt: new Date("2026-01-01"),
        },
      ]);

      const result = await userService.getIdentityVerificationMock("user-1");

      expect(result.stage).toBe("in_review");
      expect(result.requiredActions).toContain("Upload address proof");
      expect(result.requiredActions).toContain("Complete selfie check");
    });

    it("should return verified stage when user is verified", async () => {
      userFindUnique.mockResolvedValue({ id: "user-1", verified: true });
      userDocFindMany.mockResolvedValue([]);

      const result = await userService.getIdentityVerificationMock("user-1");

      expect(result.stage).toBe("verified");
      expect(result.requiredActions).toEqual([]);
    });
  });
});

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
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { notificationService } from "../../domains/notifications/services/notifications.service";
import { prisma } from "../../config/database";

const notificationFindMany = prisma.notification.findMany as jest.Mock;
const notificationUpdateMany = prisma.notification.updateMany as jest.Mock;
const notificationDeleteMany = prisma.notification.deleteMany as jest.Mock;

describe("notificationService", () => {
  describe("list", () => {
    it("should return notifications ordered by createdAt desc", async () => {
      const mockNotifications = [
        {
          id: "n-1",
          userId: "user-1",
          message: "Booking confirmed",
          read: false,
        },
        {
          id: "n-2",
          userId: "user-1",
          message: "Payment received",
          read: true,
        },
      ];
      notificationFindMany.mockResolvedValue(mockNotifications);

      const result = await notificationService.list("user-1");

      expect(notificationFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("markRead", () => {
    it("should mark a notification as read for the user", async () => {
      notificationUpdateMany.mockResolvedValue({ count: 1 });

      const result = await notificationService.markRead("user-1", "n-1");

      expect(notificationUpdateMany).toHaveBeenCalledWith({
        where: { id: "n-1", userId: "user-1" },
        data: { read: true },
      });
    });
  });

  describe("delete", () => {
    it("should delete the notification for the user", async () => {
      notificationDeleteMany.mockResolvedValue({ count: 1 });

      const result = await notificationService.delete("user-1", "n-1");

      expect(notificationDeleteMany).toHaveBeenCalledWith({
        where: { id: "n-1", userId: "user-1" },
      });
      expect(result).toEqual({ deleted: true });
    });
  });
});

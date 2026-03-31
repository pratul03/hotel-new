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
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("../../utils/eventPublisher", () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

import { messageService } from "../../domains/messages/services/messages.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const messageCreate = prisma.message.create as jest.Mock;
const messageFindMany = prisma.message.findMany as jest.Mock;
const messageUpdateMany = prisma.message.updateMany as jest.Mock;
const messageCount = prisma.message.count as jest.Mock;

const mockMessage = {
  id: "msg-1",
  senderUserId: "user-1",
  receiverUserId: "user-2",
  content: "Hello!",
  read: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  sender: null,
  receiver: null,
};

describe("messageService", () => {
  describe("sendMessage", () => {
    it("should create and return the message", async () => {
      messageCreate.mockResolvedValue(mockMessage);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // suppress fire-and-forget

      const result = await messageService.sendMessage(
        "user-1",
        "user-2",
        "Hello!",
      );

      expect(messageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderUserId: "user-1",
            receiverUserId: "user-2",
            content: "Hello!",
          }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: "msg-1",
          senderId: "user-1",
          receiverId: "user-2",
          content: "Hello!",
          hasAttachment: false,
          messageType: "text",
        }),
      );
    });

    it("should include bookingId when provided", async () => {
      messageCreate.mockResolvedValue({
        ...mockMessage,
        bookingId: "booking-1",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await messageService.sendMessage(
        "user-1",
        "user-2",
        "About your booking",
        "booking-1",
      );

      expect(messageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bookingId: "booking-1" }),
        }),
      );
    });

    it("should serialize attachment metadata into content and parse on output", async () => {
      messageCreate.mockResolvedValue({
        ...mockMessage,
        content: "[attachment]image|https://cdn.example.com/a.jpg\n",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await messageService.sendMessage(
        "user-1",
        "user-2",
        "",
        undefined,
        "https://cdn.example.com/a.jpg",
        "image",
      );

      expect(result).toEqual(
        expect.objectContaining({
          attachmentUrl: "https://cdn.example.com/a.jpg",
          attachmentType: "image",
          hasAttachment: true,
          messageType: "attachment",
        }),
      );
    });

    it("should reject when attachmentUrl is provided without attachmentType", async () => {
      await expect(
        messageService.sendMessage(
          "user-1",
          "user-2",
          "hello",
          undefined,
          "https://cdn.example.com/a.jpg",
          undefined,
        ),
      ).rejects.toThrow(
        new AppError(
          "attachmentUrl and attachmentType must be provided together",
          400,
        ),
      );
    });
  });

  describe("getThread", () => {
    it("should return messages between two users ordered by createdAt asc", async () => {
      messageFindMany.mockResolvedValue([mockMessage]);

      const result = await messageService.getThread("user-1", "user-2");

      expect(messageFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { senderUserId: "user-1", receiverUserId: "user-2" },
              { senderUserId: "user-2", receiverUserId: "user-1" },
            ],
          },
          orderBy: { createdAt: "asc" },
        }),
      );
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "msg-1",
          senderId: "user-1",
          receiverId: "user-2",
        }),
      );
    });
  });

  describe("getConversations", () => {
    it("should return unique conversations (deduplicated by other user)", async () => {
      // Two messages with the same other user (user-2) — only first should appear
      const msg1 = { ...mockMessage, id: "msg-1" };
      const msg2 = { ...mockMessage, id: "msg-2" }; // same sender/receiver
      messageFindMany.mockResolvedValue([msg1, msg2]);

      const result = await messageService.getConversations("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-2");
    });

    it("should deduplicate messages from different directions", async () => {
      // msg from user-2 to user-1 and from user-1 to user-2 = one conversation
      const msg1 = {
        ...mockMessage,
        id: "msg-1",
        senderUserId: "user-2",
        receiverUserId: "user-1",
      };
      const msg2 = {
        ...mockMessage,
        id: "msg-2",
        senderUserId: "user-1",
        receiverUserId: "user-2",
      };
      messageFindMany.mockResolvedValue([msg1, msg2]);

      const result = await messageService.getConversations("user-1");

      expect(result).toHaveLength(1);
    });
  });

  describe("markAsRead", () => {
    it("should mark a specific message as read for the receiver", async () => {
      messageUpdateMany.mockResolvedValue({ count: 1 });

      const result = await messageService.markAsRead("user-2", "msg-1");

      expect(messageUpdateMany).toHaveBeenCalledWith({
        where: { id: "msg-1", receiverUserId: "user-2" },
        data: { read: true },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe("getUnreadCount", () => {
    it("should return the count of unread messages", async () => {
      messageCount.mockResolvedValue(3);

      const result = await messageService.getUnreadCount("user-2");

      expect(messageCount).toHaveBeenCalledWith({
        where: { receiverUserId: "user-2", read: false },
      });
      expect(result).toEqual({ unreadCount: 3 });
    });

    it("should return 0 when no unread messages", async () => {
      messageCount.mockResolvedValue(0);

      const result = await messageService.getUnreadCount("user-2");

      expect(result).toEqual({ unreadCount: 0 });
    });
  });
});

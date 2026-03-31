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
    FRONTEND_URL: "http://localhost:3000",
  },
}));

jest.mock("../../config/database", () => {
  const models = {
    room: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    notification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    wishlist: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: models,
    prisma: models,
  };
});

import { wishlistService } from "../../domains/wishlist/services/wishlist.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const roomFindUnique = prisma.room.findUnique as jest.Mock;
const userFindUnique = prisma.user.findUnique as jest.Mock;
const notificationCreate = prisma.notification.create as jest.Mock;
const notificationFindFirst = prisma.notification.findFirst as jest.Mock;
const notificationFindMany = prisma.notification.findMany as jest.Mock;
const notificationFindUnique = prisma.notification.findUnique as jest.Mock;
const notificationUpdate = prisma.notification.update as jest.Mock;
const wishlistUpsert = prisma.wishlist.upsert as jest.Mock;
const wishlistFindUnique = prisma.wishlist.findUnique as jest.Mock;
const wishlistFindFirst = prisma.wishlist.findFirst as jest.Mock;
const wishlistFindMany = prisma.wishlist.findMany as jest.Mock;
const wishlistCreateMany = prisma.wishlist.createMany as jest.Mock;
const wishlistDelete = prisma.wishlist.delete as jest.Mock;

const mockRoom = { id: "room-1", roomType: "deluxe", basePrice: 1000 };
const mockWishlistItem = {
  id: "wl-1",
  userId: "user-1",
  roomId: "room-1",
  listName: "Favorites",
};

describe("wishlistService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("add", () => {
    it("should add a room to the wishlist", async () => {
      roomFindUnique.mockResolvedValue(mockRoom);
      wishlistUpsert.mockResolvedValue(mockWishlistItem);

      const result = await wishlistService.add("user-1", "room-1");

      expect(roomFindUnique).toHaveBeenCalledWith({ where: { id: "room-1" } });
      expect(wishlistUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_roomId_listName: {
              userId: "user-1",
              roomId: "room-1",
              listName: "Favorites",
            },
          },
          create: {
            userId: "user-1",
            roomId: "room-1",
            listName: "Favorites",
          },
        }),
      );
      expect(result).toEqual(mockWishlistItem);
    });

    it("should throw AppError(404) when room not found", async () => {
      roomFindUnique.mockResolvedValue(null);

      await expect(
        wishlistService.add("user-1", "nonexistent"),
      ).rejects.toThrow(new AppError("Room not found", 404));
    });
  });

  describe("remove", () => {
    it("should remove a room from the wishlist", async () => {
      wishlistFindUnique.mockResolvedValue(mockWishlistItem);
      wishlistDelete.mockResolvedValue(mockWishlistItem);

      const result = await wishlistService.remove("user-1", "room-1");

      expect(wishlistDelete).toHaveBeenCalledWith({
        where: {
          userId_roomId_listName: {
            userId: "user-1",
            roomId: "room-1",
            listName: "Favorites",
          },
        },
      });
      expect(result).toEqual({ deleted: true });
    });

    it("should throw AppError(404) when wishlist item not found", async () => {
      wishlistFindUnique.mockResolvedValue(null);

      await expect(wishlistService.remove("user-1", "room-1")).rejects.toThrow(
        new AppError("Wishlist item not found", 404),
      );
    });
  });

  describe("list", () => {
    it("should return all wishlist items for the user", async () => {
      wishlistFindMany.mockResolvedValue([mockWishlistItem]);

      const result = await wishlistService.list("user-1");

      expect(wishlistFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1" } }),
      );
      expect(result).toEqual([mockWishlistItem]);
    });
  });

  describe("inviteCollaborator", () => {
    it("should create a wishlist invite with permission", async () => {
      wishlistFindFirst.mockResolvedValueOnce({ id: "owner-item" });
      userFindUnique.mockResolvedValue({
        id: "user-2",
        email: "guest@example.com",
        name: "Guest",
      });
      notificationFindFirst.mockResolvedValue(null);
      notificationCreate.mockResolvedValue({ id: "invite-1" });

      const result = await wishlistService.inviteCollaborator(
        "user-1",
        "Favorites",
        "guest@example.com",
        "editor",
      );

      expect(result.permission).toBe("editor");
      expect(notificationCreate).toHaveBeenCalled();
    });

    it("should throw AppError(409) when pending invite already exists", async () => {
      wishlistFindFirst.mockResolvedValueOnce({ id: "owner-item" });
      userFindUnique.mockResolvedValue({
        id: "user-2",
        email: "guest@example.com",
        name: "Guest",
      });
      notificationFindFirst.mockResolvedValue({
        id: "invite-1",
        content: JSON.stringify({ ownerId: "user-1", listName: "Favorites" }),
      });

      await expect(
        wishlistService.inviteCollaborator(
          "user-1",
          "Favorites",
          "guest@example.com",
          "viewer",
        ),
      ).rejects.toThrow(
        new AppError("Collaborator already has a pending invite", 409),
      );
    });
  });

  describe("acceptInvite", () => {
    it("should create shared list with conflict-safe naming", async () => {
      notificationFindUnique.mockResolvedValue({
        id: "invite-1",
        userId: "user-2",
        type: "wishlist_invite",
        content: JSON.stringify({
          ownerId: "user-1",
          listName: "Favorites",
          permission: "viewer",
        }),
      });
      wishlistFindMany.mockResolvedValue([{ roomId: "room-1" }]);
      wishlistFindFirst
        .mockResolvedValueOnce({ id: "exists" })
        .mockResolvedValueOnce(null);
      wishlistCreateMany.mockResolvedValue({ count: 1 });
      notificationUpdate.mockResolvedValue({});

      const result = await wishlistService.acceptInvite("user-2", "invite-1");

      expect(result.accepted).toBe(true);
      expect(result.listName).toBe("Shared - Favorites (2)");
      expect(result.permission).toBe("viewer");
    });
  });

  describe("listInvites", () => {
    it("should include permission in invite projection", async () => {
      notificationFindMany.mockResolvedValue([
        {
          id: "invite-1",
          read: false,
          createdAt: new Date(),
          content: JSON.stringify({
            ownerId: "user-1",
            listName: "Favorites",
            shareCode: "abc",
            permission: "editor",
          }),
        },
      ]);

      const result = await wishlistService.listInvites("user-2");

      expect(result[0].permission).toBe("editor");
    });
  });
});

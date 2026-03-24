import { createCrudHandlers, AppError } from "../../../utils";
import { prisma } from "../../../config/database";
import { env } from "../../../config/environment";

const encodeShareCode = (payload: { ownerId: string; listName: string }) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const decodeShareCode = (
  shareCode: string,
): { ownerId: string; listName: string } => {
  const parsed = JSON.parse(
    Buffer.from(shareCode, "base64url").toString("utf8"),
  ) as { ownerId?: string; listName?: string };

  if (!parsed.ownerId || !parsed.listName) {
    throw new AppError("Invalid share code", 400);
  }

  return {
    ownerId: parsed.ownerId,
    listName: parsed.listName,
  };
};

const normalizeListName = (listName?: string) =>
  listName?.trim() || "Favorites";

const ensureOwnedListExists = async (ownerId: string, listName: string) => {
  const existing = await prisma.wishlist.findFirst({
    where: {
      userId: ownerId,
      listName,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Wishlist collection not found", 404);
  }
};

const resolveSharedListName = async (userId: string, baseName: string) => {
  let next = baseName;
  let suffix = 2;

  for (;;) {
    const exists = await prisma.wishlist.findFirst({
      where: {
        userId,
        listName: next,
      },
      select: { id: true },
    });

    if (!exists) {
      return next;
    }

    next = `${baseName} (${suffix})`;
    suffix += 1;
  }
};

export const wishlistCrud = createCrudHandlers("wishlist", {
  includeOnGetAll: {
    room: {
      select: {
        id: true,
        roomType: true,
        basePrice: true,
        images: true,
        hotel: { select: { id: true, name: true, location: true } },
      },
    },
  },
});

export const wishlistService = {
  async add(userId: string, roomId: string, listName = "Favorites") {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    const normalizedListName = normalizeListName(listName);

    return prisma.wishlist.upsert({
      where: {
        userId_roomId_listName: {
          userId,
          roomId,
          listName: normalizedListName,
        },
      },
      create: { userId, roomId, listName: normalizedListName },
      update: {},
    });
  },

  async remove(userId: string, roomId: string, listName?: string) {
    const where = listName
      ? {
          userId_roomId_listName: {
            userId,
            roomId,
            listName,
          },
        }
      : {
          userId_roomId_listName: {
            userId,
            roomId,
            listName: "Favorites",
          },
        };

    const existing = await prisma.wishlist.findUnique({ where: where as any });

    if (!existing) {
      throw new AppError("Wishlist item not found", 404);
    }

    await prisma.wishlist.delete({
      where: where as any,
    });

    return { deleted: true };
  },

  async list(userId: string, listName?: string) {
    return prisma.wishlist.findMany({
      where: {
        userId,
        ...(listName ? { listName } : {}),
      },
      include: {
        room: {
          select: {
            id: true,
            roomType: true,
            basePrice: true,
            images: true,
            hotel: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });
  },

  async listCollections(userId: string) {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      select: {
        listName: true,
      },
    });

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.listName, (counts.get(item.listName) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },

  async createShareLink(userId: string, listName: string) {
    const normalizedListName = normalizeListName(listName);
    await ensureOwnedListExists(userId, normalizedListName);

    const shareCode = encodeShareCode({
      ownerId: userId,
      listName: normalizedListName,
    });
    return {
      shareCode,
      shareUrl: `${env.FRONTEND_URL}/wishlist?shared=${shareCode}`,
      listName: normalizedListName,
    };
  },

  async getSharedList(shareCode: string) {
    const { ownerId, listName } = decodeShareCode(shareCode);

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true },
    });

    if (!owner) {
      throw new AppError("Shared list owner not found", 404);
    }

    const items = await this.list(ownerId, listName);

    return {
      owner,
      listName,
      items,
    };
  },

  async inviteCollaborator(
    ownerId: string,
    listName: string,
    email: string,
    permission: "viewer" | "editor" = "viewer",
  ) {
    const normalizedListName = normalizeListName(listName);
    await ensureOwnedListExists(ownerId, normalizedListName);

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      throw new AppError("Invitee account not found", 404);
    }

    if (invitee.id === ownerId) {
      throw new AppError("Cannot invite yourself", 400);
    }

    const existingInvite = await prisma.notification.findFirst({
      where: {
        userId: invitee.id,
        type: "wishlist_invite",
        read: false,
        content: {
          contains: `"ownerId":"${ownerId}"`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingInvite) {
      let existingPayload: { listName?: string } = {};
      try {
        existingPayload = JSON.parse(existingInvite.content || "{}");
      } catch {
        existingPayload = {};
      }

      if (existingPayload.listName === normalizedListName) {
        throw new AppError("Collaborator already has a pending invite", 409);
      }
    }

    const shareCode = encodeShareCode({
      ownerId,
      listName: normalizedListName,
    });

    const notification = await prisma.notification.create({
      data: {
        userId: invitee.id,
        type: "wishlist_invite",
        content: JSON.stringify({
          ownerId,
          listName: normalizedListName,
          permission,
          shareCode,
        }),
        link: `/wishlist?shared=${shareCode}`,
      },
    });

    return {
      inviteId: notification.id,
      shareCode,
      invitee: {
        id: invitee.id,
        email: invitee.email,
        name: invitee.name,
      },
      permission,
    };
  },

  async listInvites(userId: string) {
    const invites = await prisma.notification.findMany({
      where: {
        userId,
        type: "wishlist_invite",
      },
      orderBy: { createdAt: "desc" },
    });

    return invites.map((invite) => {
      let payload: {
        ownerId?: string;
        listName?: string;
        shareCode?: string;
        permission?: "viewer" | "editor";
      } = {};
      try {
        payload = JSON.parse(invite.content || "{}");
      } catch {
        payload = {};
      }

      return {
        id: invite.id,
        read: invite.read,
        createdAt: invite.createdAt,
        ownerId: payload.ownerId,
        listName: payload.listName,
        shareCode: payload.shareCode,
        permission: payload.permission || "viewer",
      };
    });
  },

  async acceptInvite(userId: string, inviteId: string) {
    const invite = await prisma.notification.findUnique({
      where: { id: inviteId },
    });
    if (
      !invite ||
      invite.userId !== userId ||
      invite.type !== "wishlist_invite"
    ) {
      throw new AppError("Invite not found", 404);
    }

    let payload: {
      ownerId?: string;
      listName?: string;
      shareCode?: string;
      permission?: "viewer" | "editor";
    } = {};
    try {
      payload = JSON.parse(invite.content || "{}");
    } catch {
      throw new AppError("Invalid invite payload", 400);
    }

    if (!payload.ownerId || !payload.listName) {
      throw new AppError("Invalid invite payload", 400);
    }

    const ownerItems = await prisma.wishlist.findMany({
      where: {
        userId: payload.ownerId,
        listName: payload.listName,
      },
      select: {
        roomId: true,
      },
    });

    const targetListName = await resolveSharedListName(
      userId,
      `Shared - ${payload.listName}`,
    );

    if (ownerItems.length) {
      await prisma.wishlist.createMany({
        data: ownerItems.map((item) => ({
          userId,
          roomId: item.roomId,
          listName: targetListName,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.notification.update({
      where: { id: inviteId },
      data: { read: true },
    });

    return {
      accepted: true,
      importedItems: ownerItems.length,
      listName: targetListName,
      permission: payload.permission || "viewer",
    };
  },
};

export default wishlistService;

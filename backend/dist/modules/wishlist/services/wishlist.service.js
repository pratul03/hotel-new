"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistService = exports.wishlistCrud = void 0;
const utils_1 = require("../../../utils");
const database_1 = require("../../../config/database");
const environment_1 = require("../../../config/environment");
const encodeShareCode = (payload) => Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
const decodeShareCode = (shareCode) => {
    const parsed = JSON.parse(Buffer.from(shareCode, "base64url").toString("utf8"));
    if (!parsed.ownerId || !parsed.listName) {
        throw new utils_1.AppError("Invalid share code", 400);
    }
    return {
        ownerId: parsed.ownerId,
        listName: parsed.listName,
    };
};
const normalizeListName = (listName) => listName?.trim() || "Favorites";
const ensureOwnedListExists = async (ownerId, listName) => {
    const existing = await database_1.prisma.wishlist.findFirst({
        where: {
            userId: ownerId,
            listName,
        },
        select: { id: true },
    });
    if (!existing) {
        throw new utils_1.AppError("Wishlist collection not found", 404);
    }
};
const resolveSharedListName = async (userId, baseName) => {
    let next = baseName;
    let suffix = 2;
    for (;;) {
        const exists = await database_1.prisma.wishlist.findFirst({
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
exports.wishlistCrud = (0, utils_1.createCrudHandlers)("wishlist", {
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
exports.wishlistService = {
    async add(userId, roomId, listName = "Favorites") {
        const room = await database_1.prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            throw new utils_1.AppError("Room not found", 404);
        }
        const normalizedListName = normalizeListName(listName);
        return database_1.prisma.wishlist.upsert({
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
    async remove(userId, roomId, listName) {
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
        const existing = await database_1.prisma.wishlist.findUnique({ where: where });
        if (!existing) {
            throw new utils_1.AppError("Wishlist item not found", 404);
        }
        await database_1.prisma.wishlist.delete({
            where: where,
        });
        return { deleted: true };
    },
    async list(userId, listName) {
        return database_1.prisma.wishlist.findMany({
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
    async listCollections(userId) {
        const items = await database_1.prisma.wishlist.findMany({
            where: { userId },
            select: {
                listName: true,
            },
        });
        const counts = new Map();
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
    async createShareLink(userId, listName) {
        const normalizedListName = normalizeListName(listName);
        await ensureOwnedListExists(userId, normalizedListName);
        const shareCode = encodeShareCode({
            ownerId: userId,
            listName: normalizedListName,
        });
        return {
            shareCode,
            shareUrl: `${environment_1.env.FRONTEND_URL}/wishlist?shared=${shareCode}`,
            listName: normalizedListName,
        };
    },
    async getSharedList(shareCode) {
        const { ownerId, listName } = decodeShareCode(shareCode);
        const owner = await database_1.prisma.user.findUnique({
            where: { id: ownerId },
            select: { id: true, name: true },
        });
        if (!owner) {
            throw new utils_1.AppError("Shared list owner not found", 404);
        }
        const items = await this.list(ownerId, listName);
        return {
            owner,
            listName,
            items,
        };
    },
    async inviteCollaborator(ownerId, listName, email, permission = "viewer") {
        const normalizedListName = normalizeListName(listName);
        await ensureOwnedListExists(ownerId, normalizedListName);
        const invitee = await database_1.prisma.user.findUnique({ where: { email } });
        if (!invitee) {
            throw new utils_1.AppError("Invitee account not found", 404);
        }
        if (invitee.id === ownerId) {
            throw new utils_1.AppError("Cannot invite yourself", 400);
        }
        const existingInvite = await database_1.prisma.notification.findFirst({
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
            let existingPayload = {};
            try {
                existingPayload = JSON.parse(existingInvite.content || "{}");
            }
            catch {
                existingPayload = {};
            }
            if (existingPayload.listName === normalizedListName) {
                throw new utils_1.AppError("Collaborator already has a pending invite", 409);
            }
        }
        const shareCode = encodeShareCode({
            ownerId,
            listName: normalizedListName,
        });
        const notification = await database_1.prisma.notification.create({
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
    async listInvites(userId) {
        const invites = await database_1.prisma.notification.findMany({
            where: {
                userId,
                type: "wishlist_invite",
            },
            orderBy: { createdAt: "desc" },
        });
        return invites.map((invite) => {
            let payload = {};
            try {
                payload = JSON.parse(invite.content || "{}");
            }
            catch {
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
    async acceptInvite(userId, inviteId) {
        const invite = await database_1.prisma.notification.findUnique({
            where: { id: inviteId },
        });
        if (!invite ||
            invite.userId !== userId ||
            invite.type !== "wishlist_invite") {
            throw new utils_1.AppError("Invite not found", 404);
        }
        let payload = {};
        try {
            payload = JSON.parse(invite.content || "{}");
        }
        catch {
            throw new utils_1.AppError("Invalid invite payload", 400);
        }
        if (!payload.ownerId || !payload.listName) {
            throw new utils_1.AppError("Invalid invite payload", 400);
        }
        const ownerItems = await database_1.prisma.wishlist.findMany({
            where: {
                userId: payload.ownerId,
                listName: payload.listName,
            },
            select: {
                roomId: true,
            },
        });
        const targetListName = await resolveSharedListName(userId, `Shared - ${payload.listName}`);
        if (ownerItems.length) {
            await database_1.prisma.wishlist.createMany({
                data: ownerItems.map((item) => ({
                    userId,
                    roomId: item.roomId,
                    listName: targetListName,
                })),
                skipDuplicates: true,
            });
        }
        await database_1.prisma.notification.update({
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
exports.default = exports.wishlistService;

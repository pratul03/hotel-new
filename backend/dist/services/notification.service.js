"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const database_1 = require("../config/database");
const defaultPreferences = {
    inApp: true,
    email: true,
    push: false,
    booking: true,
    message: true,
    payment: true,
    marketing: false,
};
const parsePreferences = (raw) => {
    if (!raw)
        return { ...defaultPreferences };
    try {
        const parsed = JSON.parse(raw);
        return {
            ...defaultPreferences,
            ...(parsed && typeof parsed === "object" ? parsed : {}),
        };
    }
    catch {
        return { ...defaultPreferences };
    }
};
exports.notificationService = {
    async list(userId) {
        return database_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },
    async markRead(userId, notificationId) {
        return database_1.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true },
        });
    },
    async markAllRead(userId) {
        return database_1.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    },
    async unreadCount(userId) {
        const count = await database_1.prisma.notification.count({
            where: { userId, read: false },
        });
        return { count };
    },
    async getPreferences(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                notificationPreferences: true,
            },
        });
        return parsePreferences(user?.notificationPreferences);
    },
    async updatePreferences(userId, updates) {
        const current = await this.getPreferences(userId);
        const merged = {
            ...current,
            ...updates,
        };
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                notificationPreferences: JSON.stringify(merged),
            },
        });
        return merged;
    },
    async delete(userId, notificationId) {
        await database_1.prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
        return { deleted: true };
    },
};
exports.default = exports.notificationService;

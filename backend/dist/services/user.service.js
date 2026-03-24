"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const database_1 = require("../config/database");
const utils_1 = require("../utils");
exports.userService = {
    async getProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                verified: true,
                superhost: true,
                responseRate: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new utils_1.AppError("User not found", 404);
        return user;
    },
    async updateProfile(userId, data) {
        return database_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(typeof data.name === "string" && { name: data.name }),
                ...(typeof data.avatar === "string" && { avatar: data.avatar }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                verified: true,
                superhost: true,
                responseRate: true,
            },
        });
    },
    async addDocument(userId, documentType, docUrl) {
        return database_1.prisma.userDocument.create({
            data: {
                userId,
                documentType,
                docUrl,
            },
        });
    },
    async listDocuments(userId) {
        return database_1.prisma.userDocument.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },
    async deleteDocument(userId, docId) {
        const doc = await database_1.prisma.userDocument.findUnique({ where: { id: docId } });
        if (!doc || doc.userId !== userId) {
            throw new utils_1.AppError("Document not found", 404);
        }
        await database_1.prisma.userDocument.delete({ where: { id: docId } });
        return { deleted: true };
    },
    async getHostVerification(userId) {
        const hostVerification = await database_1.prisma.hostVerification.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        superhost: true,
                        responseRate: true,
                    },
                },
            },
        });
        if (!hostVerification) {
            throw new utils_1.AppError("Host verification record not found", 404);
        }
        return hostVerification;
    },
    async getLoyaltySummary(userId) {
        const [bookings, searchCount] = await Promise.all([
            database_1.prisma.booking.findMany({
                where: {
                    userId,
                    status: {
                        in: ["confirmed", "checked_in", "checked_out"],
                    },
                },
                select: {
                    amount: true,
                },
            }),
            database_1.prisma.searchHistory.count({ where: { userId } }),
        ]);
        const stays = bookings.length;
        const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const rewardPoints = Math.floor(totalSpent / 100) + stays * 50;
        const tier = stays >= 20
            ? "Platinum"
            : stays >= 10
                ? "Gold"
                : stays >= 5
                    ? "Silver"
                    : "Explorer";
        const referralCode = `MYBNB-${userId.slice(0, 6).toUpperCase()}`;
        return {
            tier,
            rewardPoints,
            totalSpent: Number(totalSpent.toFixed(2)),
            completedStays: stays,
            nextTierTarget: tier === "Platinum" ? null : stays < 5 ? 5 : stays < 10 ? 10 : 20,
            referralCode,
            personalizationSignals: {
                searches: searchCount,
            },
        };
    },
};
exports.default = exports.userService;

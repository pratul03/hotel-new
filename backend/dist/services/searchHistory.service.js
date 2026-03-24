"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchHistoryService = void 0;
const database_1 = require("../config/database");
exports.searchHistoryService = {
    async add(userId, payload) {
        return database_1.prisma.searchHistory.create({
            data: {
                userId,
                queryLocation: payload.queryLocation,
                checkIn: payload.checkIn,
                checkOut: payload.checkOut,
                guests: payload.guests || 1,
            },
        });
    },
    async list(userId) {
        return database_1.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    },
    async clear(userId) {
        await database_1.prisma.searchHistory.deleteMany({ where: { userId } });
        return { cleared: true };
    },
};
exports.default = exports.searchHistoryService;

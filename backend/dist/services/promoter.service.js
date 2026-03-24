"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoterService = void 0;
const database_1 = require("../config/database");
const appError_1 = require("../utils/appError");
exports.promoterService = {
    async getProfile(userId) {
        const profile = await database_1.prisma.promoterProfile.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (!profile) {
            throw new appError_1.AppError("Promoter profile not found", 404);
        }
        return profile;
    },
    async createProfile(userId, data) {
        const existing = await database_1.prisma.promoterProfile.findUnique({
            where: { userId },
        });
        if (existing) {
            throw new appError_1.AppError("Promoter profile already exists", 409);
        }
        return database_1.prisma.promoterProfile.create({
            data: {
                userId,
                companyName: data.companyName,
                website: data.website,
                businessType: data.businessType ?? "agency",
                description: data.description,
            },
        });
    },
    async updateProfile(userId, data) {
        const existing = await database_1.prisma.promoterProfile.findUnique({
            where: { userId },
        });
        if (!existing) {
            throw new appError_1.AppError("Promoter profile not found", 404);
        }
        return database_1.prisma.promoterProfile.update({
            where: { userId },
            data: {
                ...(data.companyName !== undefined && {
                    companyName: data.companyName,
                }),
                ...(data.website !== undefined && { website: data.website }),
                ...(data.businessType !== undefined && {
                    businessType: data.businessType,
                }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
            },
        });
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const tslib_1 = require("tslib");
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const database_1 = require("../../../config/database");
const environment_1 = require("../../../config/environment");
const redis_1 = require("../../../config/redis");
const session_service_1 = require("./session.service");
const jwt_1 = require("../../../utils/jwt");
const utils_1 = require("../../../utils");
const SALT_ROUNDS = 10;
const PASSWORD_RESET_EXPIRES_IN = "15m";
const createPasswordResetToken = (userId, email) => jsonwebtoken_1.default.sign({
    sub: userId,
    email,
    type: "password_reset",
}, environment_1.env.JWT_SECRET, {
    expiresIn: PASSWORD_RESET_EXPIRES_IN,
    algorithm: "HS256",
});
exports.authService = {
    async register(email, password, name, role = "guest") {
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new utils_1.AppError("User with this email already exists", 400);
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            },
        });
        // Generate token
        const sessionId = (0, crypto_1.randomUUID)();
        await session_service_1.sessionService.createSession(user.id, sessionId);
        const token = (0, jwt_1.generateToken)(user.id, user.email, user.role, sessionId);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        };
    },
    async login(email, password) {
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new utils_1.AppError("Invalid email or password", 401);
        }
        // Check password
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            throw new utils_1.AppError("Invalid email or password", 401);
        }
        // Generate token
        const sessionId = (0, crypto_1.randomUUID)();
        await session_service_1.sessionService.createSession(user.id, sessionId);
        const token = (0, jwt_1.generateToken)(user.id, user.email, user.role, sessionId);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                verified: user.verified,
                superhost: user.superhost,
            },
            token,
        };
    },
    async getCurrentUser(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                verified: true,
                superhost: true,
                responseRate: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new utils_1.AppError("User not found", 404);
        }
        return user;
    },
    async updateProfile(userId, data) {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.avatar && { avatar: data.avatar }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                verified: true,
            },
        });
        return user;
    },
    async verifyEmail(userId) {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: { verified: true },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                verified: true,
            },
        });
        return user;
    },
    async refreshToken(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });
        if (!user) {
            throw new utils_1.AppError("User not found", 404);
        }
        const sessionId = (0, crypto_1.randomUUID)();
        await session_service_1.sessionService.createSession(user.id, sessionId);
        const token = (0, jwt_1.generateToken)(user.id, user.email, user.role, sessionId);
        return { token };
    },
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await database_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
            },
        });
        // Always return success to avoid account enumeration.
        if (!user) {
            return {
                message: "If an account exists for this email, a reset link has been generated.",
            };
        }
        const resetToken = createPasswordResetToken(user.id, user.email);
        const resetUrl = `${environment_1.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
        // TODO: Send resetUrl by email from notification service.
        return {
            message: "If an account exists for this email, a reset link has been generated.",
            resetToken,
            resetUrl,
            expiresIn: PASSWORD_RESET_EXPIRES_IN,
        };
    },
    async resetPassword(token, newPassword) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
        }
        catch {
            throw new utils_1.AppError("Invalid or expired reset token", 400);
        }
        if (payload.type !== "password_reset") {
            throw new utils_1.AppError("Invalid reset token type", 400);
        }
        const user = await database_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.email !== payload.email) {
            throw new utils_1.AppError("Invalid reset token", 400);
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await session_service_1.sessionService.revokeOtherSessions(user.id);
        return { success: true };
    },
    async listSessions(userId) {
        return session_service_1.sessionService.listSessions(userId);
    },
    async revokeSession(userId, sessionId) {
        return session_service_1.sessionService.revokeSession(userId, sessionId);
    },
    async revokeOtherSessions(userId, currentSessionId) {
        return session_service_1.sessionService.revokeOtherSessions(userId, currentSessionId);
    },
    async setupMfa(userId) {
        const client = await (0, redis_1.getRedisClient)();
        const secret = (0, crypto_1.randomUUID)().replace(/-/g, "").slice(0, 32).toUpperCase();
        const key = `auth:mfa:setup:${userId}`;
        await client.set(key, JSON.stringify({ secret, createdAt: new Date().toISOString() }), {
            EX: 60 * 10,
        });
        const otpauthUrl = `otpauth://totp/MyBnB:${encodeURIComponent(userId)}?secret=${secret}&issuer=MyBnB`;
        return { secret, otpauthUrl, expiresInSeconds: 600 };
    },
    async verifyMfa(userId, code) {
        if (!/^\d{6}$/.test(code)) {
            throw new utils_1.AppError("MFA code must be a 6-digit number", 400);
        }
        const client = await (0, redis_1.getRedisClient)();
        const setupKey = `auth:mfa:setup:${userId}`;
        const setup = await client.get(setupKey);
        if (!setup) {
            throw new utils_1.AppError("MFA setup expired. Generate a new setup code.", 400);
        }
        const enabledKey = `auth:mfa:enabled:${userId}`;
        await client.set(enabledKey, "true");
        await client.del(setupKey);
        return { enabled: true };
    },
};
exports.default = exports.authService;

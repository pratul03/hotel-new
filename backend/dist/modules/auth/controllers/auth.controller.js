"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../../../utils/response");
const auth_queries_1 = require("../queries/auth.queries");
const auth_schema_1 = require("../schemas/auth.schema");
const requireUserId = (req, res) => {
    const userId = auth_queries_1.authQueries.userId(req);
    if (!userId) {
        res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        return null;
    }
    return userId;
};
exports.authController = {
    async register(req, res) {
        const { email, password, name, role } = auth_schema_1.registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register(email, password, name, role);
        res
            .status(201)
            .json((0, response_1.successResponse)(result, "User registered successfully"));
    },
    async login(req, res) {
        const { email, password } = auth_schema_1.loginSchema.parse(req.body);
        const result = await auth_service_1.authService.login(email, password);
        res.json((0, response_1.successResponse)(result, "Login successful"));
    },
    async forgotPassword(req, res) {
        const { email } = auth_schema_1.forgotPasswordSchema.parse(req.body);
        const result = await auth_service_1.authService.forgotPassword(email);
        res.json((0, response_1.successResponse)(result, "Password reset request processed"));
    },
    async resetPassword(req, res) {
        const { token, newPassword } = auth_schema_1.resetPasswordSchema.parse(req.body);
        const result = await auth_service_1.authService.resetPassword(token, newPassword);
        res.json((0, response_1.successResponse)(result, "Password reset successful"));
    },
    async getCurrentUser(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const user = await auth_service_1.authService.getCurrentUser(userId);
        res.json((0, response_1.successResponse)(user, "User profile retrieved"));
    },
    async updateProfile(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const updates = auth_schema_1.updateProfileSchema.parse(req.body);
        const user = await auth_service_1.authService.updateProfile(userId, updates);
        res.json((0, response_1.successResponse)(user, "Profile updated successfully"));
    },
    logout(_req, res) {
        // Token is invalidated on client side; no backend blacklist for MVP.
        res.json((0, response_1.successResponse)(null, "Logout successful"));
    },
    async refreshToken(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const result = await auth_service_1.authService.refreshToken(userId);
        res.json((0, response_1.successResponse)(result, "Token refreshed"));
    },
    async verifyEmail(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const user = await auth_service_1.authService.verifyEmail(userId);
        res.json((0, response_1.successResponse)(user, "Email verified"));
    },
    async listSessions(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const sessions = await auth_service_1.authService.listSessions(userId);
        res.json((0, response_1.successResponse)(sessions, "Active sessions retrieved"));
    },
    async revokeSession(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const sessionId = auth_queries_1.authQueries.getParam(req.params.sessionId);
        const result = await auth_service_1.authService.revokeSession(userId, sessionId);
        res.json((0, response_1.successResponse)(result, "Session revoked"));
    },
    async revokeOtherSessions(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const result = await auth_service_1.authService.revokeOtherSessions(userId, auth_queries_1.authQueries.sessionId(req));
        res.json((0, response_1.successResponse)(result, "Other sessions revoked"));
    },
    async setupMfa(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const result = await auth_service_1.authService.setupMfa(userId);
        res.json((0, response_1.successResponse)(result, "MFA setup created"));
    },
    async verifyMfa(req, res) {
        const userId = requireUserId(req, res);
        if (!userId) {
            return;
        }
        const { code } = auth_schema_1.mfaVerifySchema.parse(req.body);
        const result = await auth_service_1.authService.verifyMfa(userId, code);
        res.json((0, response_1.successResponse)(result, "MFA enabled"));
    },
};
exports.default = exports.authController;

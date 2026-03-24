"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const authMiddleware_1 = require("../middleware/authMiddleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    role: zod_1.z.enum(["guest", "host"]).optional().default("guest"),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, "Reset token is required"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long"),
});
const mfaVerifySchema = zod_1.z.object({
    code: zod_1.z.string().regex(/^\d{6}$/, "Code must be a 6-digit number"),
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    avatar: zod_1.z.string().url().optional(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
// Register
router.post("/register", async (req, res, next) => {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register(email, password, name, role);
        res
            .status(201)
            .json((0, response_1.successResponse)(result, "User registered successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await auth_service_1.authService.login(email, password);
        res.json((0, response_1.successResponse)(result, "Login successful"));
    }
    catch (error) {
        next(error);
    }
});
// Forgot password
router.post("/forgot-password", async (req, res, next) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const result = await auth_service_1.authService.forgotPassword(email);
        res.json((0, response_1.successResponse)(result, "Password reset request processed"));
    }
    catch (error) {
        next(error);
    }
});
// Reset password
router.post("/reset-password", async (req, res, next) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);
        const result = await auth_service_1.authService.resetPassword(token, newPassword);
        res.json((0, response_1.successResponse)(result, "Password reset successful"));
    }
    catch (error) {
        next(error);
    }
});
// Get current user
router.get("/me", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const user = await auth_service_1.authService.getCurrentUser(req.userId);
        res.json((0, response_1.successResponse)(user, "User profile retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Update profile
router.put("/me", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const updates = updateProfileSchema.parse(req.body);
        const user = await auth_service_1.authService.updateProfile(req.userId, updates);
        res.json((0, response_1.successResponse)(user, "Profile updated successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Logout
router.post("/logout", authMiddleware_1.authenticate, (req, res) => {
    // Token is invalidated on client side
    // No backend token blacklist needed for MVP
    res.json((0, response_1.successResponse)(null, "Logout successful"));
});
// Refresh token
router.post("/refresh-token", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const result = await auth_service_1.authService.refreshToken(req.userId);
        res.json((0, response_1.successResponse)(result, "Token refreshed"));
    }
    catch (error) {
        next(error);
    }
});
// Verify email
router.post("/verify-email", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const user = await auth_service_1.authService.verifyEmail(req.userId);
        res.json((0, response_1.successResponse)(user, "Email verified"));
    }
    catch (error) {
        next(error);
    }
});
// List active sessions
router.get("/sessions", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const sessions = await auth_service_1.authService.listSessions(req.userId);
        res.json((0, response_1.successResponse)(sessions, "Active sessions retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Revoke one session
router.delete("/sessions/:sessionId", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const sessionId = getParam(req.params.sessionId);
        const result = await auth_service_1.authService.revokeSession(req.userId, sessionId);
        res.json((0, response_1.successResponse)(result, "Session revoked"));
    }
    catch (error) {
        next(error);
    }
});
// Revoke all sessions except current
router.post("/sessions/revoke-others", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const result = await auth_service_1.authService.revokeOtherSessions(req.userId, req.sessionId);
        res.json((0, response_1.successResponse)(result, "Other sessions revoked"));
    }
    catch (error) {
        next(error);
    }
});
// MFA scaffold setup
router.post("/mfa/setup", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const result = await auth_service_1.authService.setupMfa(req.userId);
        res.json((0, response_1.successResponse)(result, "MFA setup created"));
    }
    catch (error) {
        next(error);
    }
});
// MFA scaffold verify
router.post("/mfa/verify", authMiddleware_1.authenticate, async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const { code } = mfaVerifySchema.parse(req.body);
        const result = await auth_service_1.authService.verifyMfa(req.userId, code);
        res.json((0, response_1.successResponse)(result, "MFA enabled"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

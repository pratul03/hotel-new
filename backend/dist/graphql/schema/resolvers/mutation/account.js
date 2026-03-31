"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountMutationResolvers = void 0;
const auth_schema_1 = require("../../../../domains/auth/schemas/auth.schema");
const auth_service_1 = require("../../../../domains/auth/services/auth.service");
const users_schema_1 = require("../../../../domains/users/schemas/users.schema");
const users_service_1 = require("../../../../domains/users/services/users.service");
const context_1 = require("../../../context");
exports.accountMutationResolvers = {
    logout: async () => ({ success: true, message: "Logout successful" }),
    updateMyProfile: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = auth_schema_1.updateProfileSchema.parse(args.input);
        return auth_service_1.authService.updateProfile(auth.userId, parsed);
    },
    verifyEmail: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return auth_service_1.authService.verifyEmail(auth.userId);
    },
    refreshToken: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return auth_service_1.authService.refreshToken(auth.userId);
    },
    forgotPassword: async (_parent, args) => {
        const parsed = auth_schema_1.forgotPasswordSchema.parse(args);
        return auth_service_1.authService.forgotPassword(parsed.email);
    },
    resetPassword: async (_parent, args) => {
        const parsed = auth_schema_1.resetPasswordSchema.parse(args.input);
        const result = await auth_service_1.authService.resetPassword(parsed.token, parsed.newPassword);
        return {
            success: Boolean(result.success),
            message: "Password reset successful",
        };
    },
    revokeSession: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        await auth_service_1.authService.revokeSession(auth.userId, args.sessionId);
        return { success: true, message: "Session revoked" };
    },
    revokeOtherSessions: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        await auth_service_1.authService.revokeOtherSessions(auth.userId, auth.sessionId);
        return { success: true, message: "Other sessions revoked" };
    },
    setupMfa: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return auth_service_1.authService.setupMfa(auth.userId);
    },
    verifyMfa: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = auth_schema_1.mfaVerifySchema.parse(args.input);
        return auth_service_1.authService.verifyMfa(auth.userId, parsed.code);
    },
    addUserDocument: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = users_schema_1.addDocumentSchema.parse(args.input);
        return users_service_1.userService.addDocument(auth.userId, parsed.documentType, parsed.docUrl);
    },
    deleteUserDocument: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        await users_service_1.userService.deleteDocument(auth.userId, args.docId);
        return { deleted: true, message: "Document deleted" };
    },
    updateUserProfile: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = users_schema_1.updateProfileSchema.parse(args.input);
        return users_service_1.userService.updateProfile(auth.userId, parsed);
    },
};

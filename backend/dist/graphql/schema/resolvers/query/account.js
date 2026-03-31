"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountQueryResolvers = void 0;
const auth_service_1 = require("../../../../domains/auth/services/auth.service");
const users_service_1 = require("../../../../domains/users/services/users.service");
const context_1 = require("../../../context");
exports.accountQueryResolvers = {
    authSessions: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return auth_service_1.authService.listSessions(auth.userId);
    },
    userDocuments: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return users_service_1.userService.listDocuments(auth.userId);
    },
    hostVerification: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return users_service_1.userService.getHostVerification(auth.userId);
    },
    loyaltySummary: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return users_service_1.userService.getLoyaltySummary(auth.userId);
    },
    identityVerification: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return users_service_1.userService.getIdentityVerification(auth.userId);
    },
};

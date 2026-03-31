"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.createGraphQLContext = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const graphql_1 = require("graphql");
const environment_1 = require("../config/environment");
const session_service_1 = require("../domains/auth/services/session.service");
const unauthorized = (message) => new graphql_1.GraphQLError(message, {
    extensions: {
        code: "UNAUTHORIZED",
        http: { status: 401 },
    },
});
const readBearerToken = (authorizationHeader) => {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return undefined;
    }
    return authorizationHeader.slice(7);
};
const createGraphQLContext = async (req, res) => {
    const token = readBearerToken(req.headers.authorization);
    if (!token) {
        return { req, res };
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
        if (decoded.sid) {
            const isActive = await session_service_1.sessionService.isSessionActive(decoded.userId, decoded.sid);
            if (!isActive) {
                throw unauthorized("Session is no longer active");
            }
            await session_service_1.sessionService.touchSession(decoded.userId, decoded.sid);
        }
        return {
            req,
            res,
            authUser: {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                sessionId: decoded.sid,
            },
        };
    }
    catch (error) {
        if (error instanceof graphql_1.GraphQLError) {
            throw error;
        }
        throw unauthorized("Invalid or expired token");
    }
};
exports.createGraphQLContext = createGraphQLContext;
const requireAuth = (context) => {
    if (!context.authUser) {
        throw unauthorized("Authentication required");
    }
    return context.authUser;
};
exports.requireAuth = requireAuth;
const requireRole = (context, roles) => {
    const authUser = (0, exports.requireAuth)(context);
    if (!roles.includes(authUser.role)) {
        throw new graphql_1.GraphQLError("Insufficient permissions", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }
    return authUser;
};
exports.requireRole = requireRole;

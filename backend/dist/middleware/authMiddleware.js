"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const session_service_1 = require("../modules/auth/services/session.service");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Missing or invalid authorization token",
                },
            });
        }
        const token = authHeader.slice(7);
        const verifyAndAttach = async () => {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
            if (decoded.sid) {
                const active = await session_service_1.sessionService.isSessionActive(decoded.userId, decoded.sid);
                if (!active) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            code: "INVALID_SESSION",
                            message: "Session is no longer active",
                        },
                    });
                }
                req.sessionId = decoded.sid;
                await session_service_1.sessionService.touchSession(decoded.userId, decoded.sid);
            }
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            next();
        };
        verifyAndAttach().catch(() => {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid or expired token",
                },
            });
        });
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "User not authenticated",
                },
            });
        }
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Insufficient permissions",
                },
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.default = exports.authenticate;

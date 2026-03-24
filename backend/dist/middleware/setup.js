"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMiddleware = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const environment_1 = require("../config/environment");
const errorHandler_1 = require("../middleware/errorHandler");
const requestLogger_1 = require("../middleware/requestLogger");
const auth_routes_1 = tslib_1.__importDefault(require("../routes/auth.routes"));
const hotel_routes_1 = tslib_1.__importDefault(require("../routes/hotel.routes"));
const room_routes_1 = tslib_1.__importDefault(require("../routes/room.routes"));
const booking_routes_1 = tslib_1.__importDefault(require("../routes/booking.routes"));
const review_routes_1 = tslib_1.__importDefault(require("../routes/review.routes"));
const wishlist_routes_1 = tslib_1.__importDefault(require("../routes/wishlist.routes"));
const users_routes_1 = tslib_1.__importDefault(require("../routes/users.routes"));
const messages_routes_1 = tslib_1.__importDefault(require("../routes/messages.routes"));
const notifications_routes_1 = tslib_1.__importDefault(require("../routes/notifications.routes"));
const support_routes_1 = tslib_1.__importDefault(require("../routes/support.routes"));
const search_history_routes_1 = tslib_1.__importDefault(require("../routes/search-history.routes"));
const reports_routes_1 = tslib_1.__importDefault(require("../routes/reports.routes"));
const payments_routes_1 = tslib_1.__importDefault(require("../routes/payments.routes"));
const promotions_routes_1 = tslib_1.__importDefault(require("../routes/promotions.routes"));
const host_profile_routes_1 = tslib_1.__importDefault(require("../routes/host-profile.routes"));
const host_finance_routes_1 = tslib_1.__importDefault(require("../routes/host-finance.routes"));
const host_tools_routes_1 = tslib_1.__importDefault(require("../routes/host-tools.routes"));
const setupMiddleware = (app) => {
    // Trust proxy
    app.set("trust proxy", 1);
    // Helmet - Security headers
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: environment_1.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    // Compression
    app.use((0, compression_1.default)());
    // Morgan - Request logging
    app.use((0, morgan_1.default)("combined"));
    // Body parsers
    app.use(express_1.default.json({
        limit: "10mb",
        verify: (req, _res, buf) => {
            req.rawBody = buf.toString("utf8");
        },
    }));
    app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
    // Request logger middleware
    app.use(requestLogger_1.requestLogger);
    // Health check (before other routes)
    app.get("/health", (_req, res) => {
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: environment_1.env.NODE_ENV,
        });
    });
    // Routes
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/hotels", hotel_routes_1.default);
    app.use("/api/rooms", room_routes_1.default);
    app.use("/api/bookings", booking_routes_1.default);
    app.use("/api/reviews", review_routes_1.default);
    app.use("/api/wishlist", wishlist_routes_1.default);
    app.use("/api/wishlists", wishlist_routes_1.default);
    app.use("/api/users", users_routes_1.default);
    app.use("/api/messages", messages_routes_1.default);
    app.use("/api/notifications", notifications_routes_1.default);
    app.use("/api/support", support_routes_1.default);
    app.use("/api/search-history", search_history_routes_1.default);
    app.use("/api/reports", reports_routes_1.default);
    app.use("/api/payments", payments_routes_1.default);
    app.use("/api/promotions", promotions_routes_1.default);
    app.use("/api/host", host_profile_routes_1.default);
    app.use("/api/host/finance", host_finance_routes_1.default);
    app.use("/api/host/tools", host_tools_routes_1.default);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: "NOT_FOUND",
                message: `Route ${req.path} not found`,
            },
        });
    });
    // Error handler (must be last)
    app.use(errorHandler_1.errorHandler);
};
exports.setupMiddleware = setupMiddleware;
exports.default = exports.setupMiddleware;

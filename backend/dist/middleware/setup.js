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
const auth_routes_1 = tslib_1.__importDefault(require("../modules/auth/routes/auth.routes"));
const hotel_routes_1 = tslib_1.__importDefault(require("../modules/hotel/routes/hotel.routes"));
const room_routes_1 = tslib_1.__importDefault(require("../modules/room/routes/room.routes"));
const booking_routes_1 = tslib_1.__importDefault(require("../modules/booking/routes/booking.routes"));
const review_routes_1 = tslib_1.__importDefault(require("../modules/review/routes/review.routes"));
const wishlist_routes_1 = tslib_1.__importDefault(require("../modules/wishlist/routes/wishlist.routes"));
const users_routes_1 = tslib_1.__importDefault(require("../modules/users/routes/users.routes"));
const messages_routes_1 = tslib_1.__importDefault(require("../modules/messages/routes/messages.routes"));
const notifications_routes_1 = tslib_1.__importDefault(require("../modules/notifications/routes/notifications.routes"));
const support_routes_1 = tslib_1.__importDefault(require("../modules/support/routes/support.routes"));
const search_history_routes_1 = tslib_1.__importDefault(require("../modules/search-history/routes/search-history.routes"));
const reports_routes_1 = tslib_1.__importDefault(require("../modules/reports/routes/reports.routes"));
const payments_routes_1 = tslib_1.__importDefault(require("../modules/payments/routes/payments.routes"));
const promotions_routes_1 = tslib_1.__importDefault(require("../modules/promotions/routes/promotions.routes"));
const host_profile_routes_1 = tslib_1.__importDefault(require("../modules/host-profile/routes/host-profile.routes"));
const host_finance_routes_1 = tslib_1.__importDefault(require("../modules/host-finance/routes/host-finance.routes"));
const host_tools_routes_1 = tslib_1.__importDefault(require("../modules/host-tools/routes/host-tools.routes"));
const invoices_routes_1 = tslib_1.__importDefault(require("../modules/invoices/routes/invoices.routes"));
const API_V1_BASE = "/api/v1";
const mountApiRoutes = (app, prefix) => {
    app.use(`${prefix}/auth`, auth_routes_1.default);
    app.use(`${prefix}/hotels`, hotel_routes_1.default);
    app.use(`${prefix}/rooms`, room_routes_1.default);
    app.use(`${prefix}/bookings`, booking_routes_1.default);
    app.use(`${prefix}/reviews`, review_routes_1.default);
    app.use(`${prefix}/wishlist`, wishlist_routes_1.default);
    app.use(`${prefix}/wishlists`, wishlist_routes_1.default);
    app.use(`${prefix}/users`, users_routes_1.default);
    app.use(`${prefix}/messages`, messages_routes_1.default);
    app.use(`${prefix}/notifications`, notifications_routes_1.default);
    app.use(`${prefix}/support`, support_routes_1.default);
    app.use(`${prefix}/search-history`, search_history_routes_1.default);
    app.use(`${prefix}/reports`, reports_routes_1.default);
    app.use(`${prefix}/payments`, payments_routes_1.default);
    app.use(`${prefix}/invoices`, invoices_routes_1.default);
    app.use(`${prefix}/promotions`, promotions_routes_1.default);
    app.use(`${prefix}/host`, host_profile_routes_1.default);
    app.use(`${prefix}/host/finance`, host_finance_routes_1.default);
    app.use(`${prefix}/host/tools`, host_tools_routes_1.default);
};
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
    app.get(`${API_V1_BASE}/health`, (_req, res) => {
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: environment_1.env.NODE_ENV,
            version: "v1",
        });
    });
    // Primary versioned routes.
    mountApiRoutes(app, API_V1_BASE);
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

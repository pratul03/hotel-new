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
const server_1 = require("../graphql/server");
const swagger_1 = require("../docs/swagger");
const setupMiddleware = async (app) => {
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
    // API docs (Swagger/OpenAPI)
    (0, swagger_1.setupSwaggerDocs)(app);
    // GraphQL-only mode: REST routes are no longer mounted.
    // GraphQL endpoint.
    await (0, server_1.setupGraphQL)(app);
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
;
exports.default = exports.setupMiddleware;

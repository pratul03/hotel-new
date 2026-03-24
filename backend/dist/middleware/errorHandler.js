"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[ERROR] ${status} - ${message}`);
    console.error(err);
    res.status(status).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;

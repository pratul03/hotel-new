"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (data, message = 'Success') => ({
    success: true,
    data,
    message,
});
exports.successResponse = successResponse;
const errorResponse = (code, message, field) => ({
    success: false,
    error: {
        code,
        message,
        ...(field && { field }),
    },
});
exports.errorResponse = errorResponse;
const paginatedResponse = (data, page, limit, total) => ({
    success: true,
    data,
    pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
    },
});
exports.paginatedResponse = paginatedResponse;
exports.default = { successResponse: exports.successResponse, errorResponse: exports.errorResponse, paginatedResponse: exports.paginatedResponse };

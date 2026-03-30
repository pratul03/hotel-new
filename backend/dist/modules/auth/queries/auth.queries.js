"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authQueries = void 0;
class AuthQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static sessionId(req) {
        return req.sessionId;
    }
}
exports.authQueries = AuthQueries;
exports.default = exports.authQueries;

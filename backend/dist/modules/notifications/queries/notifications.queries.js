"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsQueries = void 0;
class NotificationsQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static id(req) {
        return this.getParam(req.params.id);
    }
}
exports.notificationsQueries = NotificationsQueries;
exports.default = exports.notificationsQueries;

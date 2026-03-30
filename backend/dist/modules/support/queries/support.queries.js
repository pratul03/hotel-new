"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportQueries = void 0;
class SupportQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static ticketId(req) {
        return this.getParam(req.params.id);
    }
}
exports.supportQueries = SupportQueries;
exports.default = exports.supportQueries;

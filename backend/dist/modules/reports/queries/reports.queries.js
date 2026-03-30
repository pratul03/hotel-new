"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsQueries = void 0;
class ReportsQueries {
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
exports.reportsQueries = ReportsQueries;
exports.default = exports.reportsQueries;

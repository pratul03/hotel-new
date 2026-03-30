"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewQueries = void 0;
class ReviewQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static id(req) {
        return this.getParam(req.params.id);
    }
    static bookingId(req) {
        return this.getParam(req.params.bookingId);
    }
}
exports.reviewQueries = ReviewQueries;
exports.default = exports.reviewQueries;

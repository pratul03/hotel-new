"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingQueries = void 0;
class BookingQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static id(req) {
        return this.getParam(req.params.id);
    }
}
exports.bookingQueries = BookingQueries;
exports.default = exports.bookingQueries;

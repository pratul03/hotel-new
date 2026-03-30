"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsQueries = void 0;
const database_1 = require("../../../config/database");
exports.paymentsQueries = {
    findById(id) {
        return database_1.prisma.payment.findUnique({ where: { id } });
    },
    findByBooking(bookingId) {
        return database_1.prisma.payment.findUnique({ where: { bookingId } });
    },
};
exports.default = exports.paymentsQueries;

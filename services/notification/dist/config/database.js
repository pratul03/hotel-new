"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.__notifPrisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    global.__notifPrisma = exports.prisma;
}
exports.default = exports.prisma;

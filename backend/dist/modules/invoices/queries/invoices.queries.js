"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesQueries = void 0;
const database_1 = require("../../../config/database");
exports.invoicesQueries = {
    findById(id) {
        return database_1.prisma.invoiceDocument.findUnique({ where: { id } });
    },
    listRecent(limit = 200) {
        return database_1.prisma.invoiceDocument.findMany({
            orderBy: { issuedAt: "desc" },
            take: limit,
        });
    },
};
exports.default = exports.invoicesQueries;

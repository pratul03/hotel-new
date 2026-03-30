"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostfinanceQueries = void 0;
const host_finance_schema_1 = require("../schemas/host-finance.schema");
class HostFinanceQueries {
    static userId(req) {
        return req.userId;
    }
    static listQuery(req) {
        return host_finance_schema_1.hostFinanceQuerySchema.parse(req.query);
    }
}
exports.hostfinanceQueries = HostFinanceQueries;
exports.default = exports.hostfinanceQueries;

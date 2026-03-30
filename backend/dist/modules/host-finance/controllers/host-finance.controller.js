"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostfinanceController = void 0;
const utils_1 = require("../../../utils");
const host_finance_service_1 = require("../services/host-finance.service");
const host_finance_queries_1 = require("../queries/host-finance.queries");
const host_finance_schema_1 = require("../schemas/host-finance.schema");
exports.hostfinanceController = {
    async getEarnings(req, res) {
        const payload = host_finance_queries_1.hostfinanceQueries.listQuery(req);
        const data = await host_finance_service_1.hostFinanceService.getEarningsOverview(host_finance_queries_1.hostfinanceQueries.userId(req), payload.months ?? 6);
        res.json((0, utils_1.successResponse)(data, "Host earnings retrieved"));
    },
    async getTransactions(req, res) {
        const payload = host_finance_queries_1.hostfinanceQueries.listQuery(req);
        const data = await host_finance_service_1.hostFinanceService.getTransactions(host_finance_queries_1.hostfinanceQueries.userId(req), payload.limit ?? 20);
        res.json((0, utils_1.successResponse)(data, "Host transactions retrieved"));
    },
    async getPayoutAccount(req, res) {
        const data = await host_finance_service_1.hostFinanceService.getPayoutAccount(host_finance_queries_1.hostfinanceQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Host payout account retrieved"));
    },
    async upsertPayoutAccount(req, res) {
        const payload = host_finance_schema_1.payoutAccountSchema.parse(req.body);
        const data = await host_finance_service_1.hostFinanceService.upsertPayoutAccount(host_finance_queries_1.hostfinanceQueries.userId(req), payload);
        res.json((0, utils_1.successResponse)(data, "Host payout account saved"));
    },
    async getPayouts(req, res) {
        const payload = host_finance_queries_1.hostfinanceQueries.listQuery(req);
        const data = await host_finance_service_1.hostFinanceService.getPayoutHistory(host_finance_queries_1.hostfinanceQueries.userId(req), payload.limit ?? 20);
        res.json((0, utils_1.successResponse)(data, "Host payouts retrieved"));
    },
    async requestPayout(req, res) {
        const payload = host_finance_schema_1.payoutRequestSchema.parse(req.body);
        const data = await host_finance_service_1.hostFinanceService.requestPayout(host_finance_queries_1.hostfinanceQueries.userId(req), payload.amount, payload.notes);
        res.status(201).json((0, utils_1.successResponse)(data, "Payout request created"));
    },
};
exports.default = exports.hostfinanceController;

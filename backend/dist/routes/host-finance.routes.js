"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const host_finance_service_1 = require("../services/host-finance.service");
const router = (0, express_1.Router)();
const payoutAccountSchema = zod_1.z.object({
    accountHolderName: zod_1.z.string().min(2),
    bankName: zod_1.z.string().min(2),
    accountNumber: zod_1.z.string().min(8).max(24),
    ifscCode: zod_1.z.string().min(8).max(20),
    payoutMethod: zod_1.z.enum(["bank_transfer", "upi"]).optional(),
    upiId: zod_1.z.string().optional(),
});
const payoutRequestSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    notes: zod_1.z.string().max(500).optional(),
});
router.get("/earnings", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const rawMonths = Number(req.query.months ?? 6);
    const months = Number.isFinite(rawMonths) ? rawMonths : 6;
    const data = await host_finance_service_1.hostFinanceService.getEarningsOverview(req.userId, months);
    res.json((0, utils_1.successResponse)(data, "Host earnings retrieved"));
}));
router.get("/transactions", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const rawLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const data = await host_finance_service_1.hostFinanceService.getTransactions(req.userId, limit);
    res.json((0, utils_1.successResponse)(data, "Host transactions retrieved"));
}));
router.get("/payout-account", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const data = await host_finance_service_1.hostFinanceService.getPayoutAccount(req.userId);
    res.json((0, utils_1.successResponse)(data, "Host payout account retrieved"));
}));
router.put("/payout-account", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const payload = payoutAccountSchema.parse(req.body);
    const data = await host_finance_service_1.hostFinanceService.upsertPayoutAccount(req.userId, payload);
    res.json((0, utils_1.successResponse)(data, "Host payout account saved"));
}));
router.get("/payouts", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const rawLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const data = await host_finance_service_1.hostFinanceService.getPayoutHistory(req.userId, limit);
    res.json((0, utils_1.successResponse)(data, "Host payouts retrieved"));
}));
router.post("/payouts/request", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const payload = payoutRequestSchema.parse(req.body);
    const data = await host_finance_service_1.hostFinanceService.requestPayout(req.userId, payload.amount, payload.notes);
    res.status(201).json((0, utils_1.successResponse)(data, "Payout request created"));
}));
exports.default = router;

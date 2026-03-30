"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsController = void 0;
const zod_1 = require("zod");
const utils_1 = require("../../../utils");
const payment_service_1 = require("../services/payment.service");
const payments_schema_1 = require("../schemas/payments.schema");
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
const settlementQuoteQuerySchema = zod_1.z.object({
    amountInInr: zod_1.z.coerce.number().positive(),
    targetCurrency: zod_1.z.string().trim().length(3),
});
const settlementBookingQuerySchema = zod_1.z.object({
    targetCurrency: zod_1.z.string().trim().length(3),
});
exports.paymentsController = {
    async createOrder(req, res) {
        const payload = payments_schema_1.createPaymentSchema.parse(req.body);
        const data = await payment_service_1.paymentService.createOrder(req.userId, payload.bookingId);
        res.status(201).json((0, utils_1.successResponse)(data, "Payment order created"));
    },
    async createChargeback(req, res) {
        const payload = payments_schema_1.createChargebackSchema.parse(req.body);
        const data = await payment_service_1.paymentService.createChargebackCase(req.userId, payload.paymentId, payload.reason, payload.evidenceUrls);
        res.status(201).json((0, utils_1.successResponse)(data, "Chargeback case created"));
    },
    async listChargebacks(req, res) {
        const data = await payment_service_1.paymentService.listChargebackCases(req.userId);
        res.json((0, utils_1.successResponse)(data, "Chargeback cases fetched"));
    },
    async listFxRates(_req, res) {
        const data = await payment_service_1.paymentService.listFxRates();
        res.json((0, utils_1.successResponse)(data, "FX rates fetched"));
    },
    async upsertFxRate(req, res) {
        const payload = payments_schema_1.fxRateSchema.parse(req.body);
        const data = await payment_service_1.paymentService.upsertFxRate(req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "FX rate upserted"));
    },
    async getQueueSummary(_req, res) {
        const data = await payment_service_1.paymentService.getPaymentQueueSummary();
        res.json((0, utils_1.successResponse)(data, "Payment queue summary fetched"));
    },
    async reprocessStale(req, res) {
        const payload = payments_schema_1.reprocessStaleSchema.parse(req.body ?? {});
        const data = await payment_service_1.paymentService.reprocessStalePayments(req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "Stale payment reprocess completed"));
    },
    async updateChargeback(req, res) {
        const caseId = getParam(req.params.id);
        const payload = payments_schema_1.updateChargebackSchema.parse(req.body);
        const data = await payment_service_1.paymentService.advanceChargebackCase(req.userId, caseId, payload.status, payload.note);
        res.json((0, utils_1.successResponse)(data, "Chargeback case updated"));
    },
    async handleWebhook(req, res) {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody || "";
        const data = await payment_service_1.paymentService.handleWebhook(signature, rawBody);
        res.json((0, utils_1.successResponse)(data, "Webhook processed"));
    },
    async generateInvoice(req, res) {
        const bookingId = getParam(req.params.bookingId);
        const data = await payment_service_1.paymentService.generateTaxInvoice(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(data, "Invoice generated"));
    },
    async getSettlementQuote(req, res) {
        const payload = settlementQuoteQuerySchema.parse(req.query);
        const data = await payment_service_1.paymentService.getSettlementQuote(payload.amountInInr, payload.targetCurrency);
        res.json((0, utils_1.successResponse)(data, "Settlement quote generated"));
    },
    async getSettlementSummary(req, res) {
        const payload = settlementBookingQuerySchema.parse(req.query);
        const summary = await payment_service_1.paymentService.getSettlementSummary(req.userId, getParam(req.params.bookingId), payload.targetCurrency);
        res.json((0, utils_1.successResponse)(summary, "Settlement summary generated"));
    },
    async getByBooking(req, res) {
        const bookingId = getParam(req.params.bookingId);
        const data = await payment_service_1.paymentService.getByBooking(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(data, "Payment by booking fetched"));
    },
    async getById(req, res) {
        const id = getParam(req.params.id);
        const data = await payment_service_1.paymentService.getById(id);
        res.json((0, utils_1.successResponse)(data, "Payment fetched"));
    },
};
exports.default = exports.paymentsController;

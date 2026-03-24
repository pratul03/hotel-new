"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const payment_service_1 = require("../services/payment.service");
const router = (0, express_1.Router)();
const createPaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.post("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = createPaymentSchema.parse(req.body);
    const data = await payment_service_1.paymentService.createOrder(req.userId, payload.bookingId);
    res.status(201).json((0, utils_1.successResponse)(data, "Payment order created"));
}));
router.post("/webhook", (0, utils_1.catchAsync)(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || "";
    const data = await payment_service_1.paymentService.handleWebhook(signature, rawBody);
    res.json((0, utils_1.successResponse)(data, "Webhook processed"));
}));
router.get("/booking/:bookingId", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.bookingId);
    const data = await payment_service_1.paymentService.getByBooking(bookingId);
    res.json((0, utils_1.successResponse)(data, "Payment by booking fetched"));
}));
router.get("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await payment_service_1.paymentService.getById(id);
    res.json((0, utils_1.successResponse)(data, "Payment fetched"));
}));
exports.default = router;

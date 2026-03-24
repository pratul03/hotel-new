"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const promotion_service_1 = require("../services/promotion.service");
const router = (0, express_1.Router)();
const validateSchema = zod_1.z.object({
    code: zod_1.z.string().min(2),
    subtotal: zod_1.z.number().min(0),
});
router.get("/", (_req, res) => {
    const data = promotion_service_1.promotionService.list();
    res.json((0, response_1.successResponse)(data, "Promotions listed"));
});
router.post("/validate", (req, res, next) => {
    try {
        const payload = validateSchema.parse(req.body);
        const data = promotion_service_1.promotionService.validate(payload.code, payload.subtotal);
        res.json((0, response_1.successResponse)(data, "Promotion validated"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

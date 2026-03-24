"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionService = void 0;
const utils_1 = require("../utils");
const PROMOTIONS = [
    {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        minSubtotal: 1000,
        description: "10% off for first-time style bookings",
    },
    {
        code: "WEEKEND500",
        type: "flat",
        value: 500,
        minSubtotal: 4000,
        description: "Flat 500 off on weekend getaways",
    },
];
exports.promotionService = {
    validate(code, subtotal) {
        const normalized = code.trim().toUpperCase();
        const rule = PROMOTIONS.find((item) => item.code === normalized);
        if (!rule) {
            throw new utils_1.AppError("Invalid promotion code", 400);
        }
        if (typeof rule.minSubtotal === "number" && subtotal < rule.minSubtotal) {
            throw new utils_1.AppError(`Minimum booking subtotal for this code is ${rule.minSubtotal}`, 400);
        }
        const discountAmount = rule.type === "percent"
            ? Number(((subtotal * rule.value) / 100).toFixed(2))
            : Math.min(rule.value, subtotal);
        return {
            code: rule.code,
            description: rule.description,
            discountAmount,
            subtotal,
            finalSubtotal: Number((subtotal - discountAmount).toFixed(2)),
        };
    },
    list() {
        return PROMOTIONS.map((promo) => ({
            code: promo.code,
            description: promo.description,
            minSubtotal: promo.minSubtotal || 0,
        }));
    },
};
exports.default = exports.promotionService;

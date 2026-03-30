"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionsController = void 0;
const response_1 = require("../../../utils/response");
const promotions_queries_1 = require("../queries/promotions.queries");
const promotions_service_1 = require("../services/promotions.service");
exports.promotionsController = {
    async list(_req, res) {
        const data = promotions_service_1.promotionService.list();
        res.json((0, response_1.successResponse)(data, "Promotions listed"));
    },
    async validate(req, res) {
        const payload = promotions_queries_1.promotionsQueries.validatePayload(req);
        const data = promotions_service_1.promotionService.validate(payload.code, payload.subtotal);
        res.json((0, response_1.successResponse)(data, "Promotion validated"));
    },
};
exports.default = exports.promotionsController;

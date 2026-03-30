"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionsQueries = void 0;
const promotions_schema_1 = require("../schemas/promotions.schema");
class PromotionsQueries {
    static validatePayload(req) {
        return promotions_schema_1.validateSchema.parse(req.body);
    }
}
exports.promotionsQueries = PromotionsQueries;
exports.default = exports.promotionsQueries;

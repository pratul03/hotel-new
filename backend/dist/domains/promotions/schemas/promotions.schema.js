"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionsSchemas = exports.validateSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.validateSchema = validation_1.z.object({
    code: validation_1.v.text(2, 100),
    subtotal: validation_1.v.number(0),
});
exports.promotionsSchemas = {
    validateSchema: exports.validateSchema,
};
exports.default = exports.promotionsSchemas;

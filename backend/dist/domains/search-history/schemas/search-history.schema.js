"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchhistorySchemas = exports.createSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createSchema = validation_1.z.object({
    queryLocation: validation_1.v.id(),
    checkIn: validation_1.v.isoDateTime().optional(),
    checkOut: validation_1.v.isoDateTime().optional(),
    guests: validation_1.v.positiveInt().optional(),
});
exports.searchhistorySchemas = {
    createSchema: exports.createSchema,
};
exports.default = exports.searchhistorySchemas;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsSchemas = exports.preferencesSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.preferencesSchema = validation_1.z.object({
    inApp: validation_1.v.bool().optional(),
    email: validation_1.v.bool().optional(),
    push: validation_1.v.bool().optional(),
    booking: validation_1.v.bool().optional(),
    message: validation_1.v.bool().optional(),
    payment: validation_1.v.bool().optional(),
    marketing: validation_1.v.bool().optional(),
});
exports.notificationsSchemas = {
    preferencesSchema: exports.preferencesSchema,
};
exports.default = exports.notificationsSchemas;

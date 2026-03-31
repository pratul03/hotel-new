"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersSchemas = exports.addDocumentSchema = exports.updateProfileSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.updateProfileSchema = validation_1.z.object({
    name: validation_1.v.text(2, 120).optional(),
    avatar: validation_1.v.url().optional(),
});
exports.addDocumentSchema = validation_1.z.object({
    documentType: validation_1.v.id().max(120),
    docUrl: validation_1.v.url(),
});
exports.usersSchemas = {
    updateProfileSchema: exports.updateProfileSchema,
    addDocumentSchema: exports.addDocumentSchema,
};
exports.default = exports.usersSchemas;

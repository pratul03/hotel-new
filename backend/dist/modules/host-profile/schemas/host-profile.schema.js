"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostprofileSchemas = exports.updateProfileSchema = exports.profileSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.profileSchema = validation_1.z.object({
    companyName: validation_1.z.coerce
        .string()
        .trim()
        .min(2, "Company name must be at least 2 characters")
        .max(180),
    website: validation_1.z
        .union([
        validation_1.z.coerce.string().trim().pipe(validation_1.z.url("Invalid URL")),
        validation_1.z.literal(""),
    ])
        .optional()
        .transform((value) => (value === "" ? undefined : value)),
    businessType: validation_1.z
        .enum(["agency", "chain", "management_company", "individual"])
        .optional(),
    description: validation_1.v.trimmed(1000).optional(),
});
exports.updateProfileSchema = exports.profileSchema.partial();
exports.hostprofileSchemas = {
    profileSchema: exports.profileSchema,
    updateProfileSchema: exports.updateProfileSchema,
};
exports.default = exports.hostprofileSchemas;

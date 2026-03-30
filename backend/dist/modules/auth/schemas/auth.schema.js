"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchemas = exports.updateProfileSchema = exports.mfaVerifySchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.registerSchema = validation_1.z.object({
    email: validation_1.v.email("Invalid email format"),
    password: validation_1.v.text(6, 128),
    name: validation_1.v
        .text(2, 120)
        .refine((value) => value.length >= 2, "Name must be at least 2 characters")
        .refine((value) => value.length <= 120, "Name is too long"),
    role: validation_1.z.enum(["guest", "host"]).optional().default("guest"),
});
exports.loginSchema = validation_1.z.object({
    email: validation_1.v.email("Invalid email format"),
    password: validation_1.v.text(1),
});
exports.forgotPasswordSchema = validation_1.z.object({
    email: validation_1.v.email("Invalid email format"),
});
exports.resetPasswordSchema = validation_1.z.object({
    token: validation_1.v
        .text(10)
        .refine((value) => value.length >= 10, "Reset token is required"),
    newPassword: validation_1.v
        .text(8, 128)
        .refine((value) => value.length >= 8, "Password must be at least 8 characters")
        .refine((value) => value.length <= 128, "Password is too long"),
});
exports.mfaVerifySchema = validation_1.z.object({
    code: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^\d{6}$/, "Code must be a 6-digit number"),
});
exports.updateProfileSchema = validation_1.z.object({
    name: validation_1.v.text(2, 120).optional(),
    avatar: validation_1.v.url().optional(),
});
exports.authSchemas = {
    registerSchema: exports.registerSchema,
    loginSchema: exports.loginSchema,
    forgotPasswordSchema: exports.forgotPasswordSchema,
    resetPasswordSchema: exports.resetPasswordSchema,
    mfaVerifySchema: exports.mfaVerifySchema,
    updateProfileSchema: exports.updateProfileSchema,
};
exports.default = exports.authSchemas;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v = exports.ValidationFactory = exports.z = void 0;
const tslib_1 = require("tslib");
const z = tslib_1.__importStar(require("zod"));
exports.z = z;
class ValidationFactory {
    static id() {
        return z.coerce.string().trim().min(1);
    }
    static text(min = 1, max) {
        let schema = z.coerce.string().trim().min(min);
        if (typeof max === "number") {
            schema = schema.max(max);
        }
        return schema;
    }
    static trimmed(max) {
        let schema = z.coerce.string().trim();
        if (typeof max === "number") {
            schema = schema.max(max);
        }
        return schema;
    }
    static email(message) {
        return z.coerce
            .string()
            .trim()
            .toLowerCase()
            .pipe(z.email(message ?? "Invalid email format"));
    }
    static url(message) {
        return z.coerce
            .string()
            .trim()
            .pipe(message ? z.url(message) : z.url());
    }
    static isoDateTime() {
        return z.coerce.string().trim().pipe(z.iso.datetime());
    }
    static int(min, max) {
        let schema = z.coerce.number().int();
        if (typeof min === "number")
            schema = schema.min(min);
        if (typeof max === "number")
            schema = schema.max(max);
        return schema;
    }
    static number(min, max) {
        let schema = z.coerce.number();
        if (typeof min === "number")
            schema = schema.min(min);
        if (typeof max === "number")
            schema = schema.max(max);
        return schema;
    }
    static positiveInt() {
        return z.coerce.number().int().positive();
    }
    static positiveNumber() {
        return z.coerce.number().positive();
    }
    static bool() {
        return z.coerce.boolean();
    }
}
exports.ValidationFactory = ValidationFactory;
// Alias for concise usage in schema files.
exports.v = ValidationFactory;

import * as z from "zod";

// Central entrypoint for validation so schema files share one import surface.
export { z };

export class ValidationFactory {
  static id() {
    return z.coerce.string().trim().min(1);
  }

  static text(min = 1, max?: number) {
    let schema = z.coerce.string().trim().min(min);
    if (typeof max === "number") {
      schema = schema.max(max);
    }
    return schema;
  }

  static trimmed(max?: number) {
    let schema = z.coerce.string().trim();
    if (typeof max === "number") {
      schema = schema.max(max);
    }
    return schema;
  }

  static email(message?: string) {
    return z.coerce
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(message ?? "Invalid email format"));
  }

  static url(message?: string) {
    return z.coerce
      .string()
      .trim()
      .pipe(message ? z.url(message) : z.url());
  }

  static isoDateTime() {
    return z.coerce.string().trim().pipe(z.iso.datetime());
  }

  static int(min?: number, max?: number) {
    let schema = z.coerce.number().int();
    if (typeof min === "number") schema = schema.min(min);
    if (typeof max === "number") schema = schema.max(max);
    return schema;
  }

  static number(min?: number, max?: number) {
    let schema = z.coerce.number();
    if (typeof min === "number") schema = schema.min(min);
    if (typeof max === "number") schema = schema.max(max);
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

// Alias for concise usage in schema files.
export const v = ValidationFactory;

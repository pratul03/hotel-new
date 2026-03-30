import { z, v } from "../../../utils/validation";

export const registerSchema = z.object({
  email: v.email("Invalid email format"),
  password: v.text(6, 128),
  name: v
    .text(2, 120)
    .refine((value) => value.length >= 2, "Name must be at least 2 characters")
    .refine((value) => value.length <= 120, "Name is too long"),
  role: z.enum(["guest", "host"]).optional().default("guest"),
});

export const loginSchema = z.object({
  email: v.email("Invalid email format"),
  password: v.text(1),
});

export const forgotPasswordSchema = z.object({
  email: v.email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: v
    .text(10)
    .refine((value) => value.length >= 10, "Reset token is required"),
  newPassword: v
    .text(8, 128)
    .refine(
      (value) => value.length >= 8,
      "Password must be at least 8 characters",
    )
    .refine((value) => value.length <= 128, "Password is too long"),
});

export const mfaVerifySchema = z.object({
  code: z.coerce
    .string()
    .trim()
    .regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

export const updateProfileSchema = z.object({
  name: v.text(2, 120).optional(),
  avatar: v.url().optional(),
});

export const authSchemas = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  updateProfileSchema,
};

export default authSchemas;

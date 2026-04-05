import { z, v } from "../../../utils/validation";

const ADMIN_USER_ROLES = ["guest", "host", "admin"] as const;

export const updateProfileSchema = z.object({
  name: v.text(2, 120).optional(),
  avatar: v.url().optional(),
});

export const addDocumentSchema = z.object({
  documentType: v.id().max(120),
  docUrl: v.url(),
});

export const adminUsersFilterSchema = z.object({
  search: z.coerce.string().trim().min(1).max(120).optional(),
  role: z.enum(ADMIN_USER_ROLES).optional(),
  verified: v.bool().optional(),
  superhost: v.bool().optional(),
  page: v.int(1, 10000).optional(),
  limit: v.int(1, 200).optional(),
});

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(ADMIN_USER_ROLES).optional(),
    verified: v.bool().optional(),
    superhost: v.bool().optional(),
  })
  .refine(
    (input) =>
      typeof input.role === "string" ||
      typeof input.verified === "boolean" ||
      typeof input.superhost === "boolean",
    { message: "At least one moderation field is required" },
  );

export const usersSchemas = {
  updateProfileSchema,
  addDocumentSchema,
  adminUsersFilterSchema,
  adminUpdateUserSchema,
};

export default usersSchemas;

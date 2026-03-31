import { z, v } from "../../../utils/validation";

export const profileSchema = z.object({
  companyName: z.coerce
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(180),
  website: z
    .union([
      z.coerce.string().trim().pipe(z.url("Invalid URL")),
      z.literal(""),
    ])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  businessType: z
    .enum(["agency", "chain", "management_company", "individual"])
    .optional(),
  description: v.trimmed(1000).optional(),
});

export const updateProfileSchema = profileSchema.partial();

export const hostprofileSchemas = {
  profileSchema,
  updateProfileSchema,
};

export default hostprofileSchemas;

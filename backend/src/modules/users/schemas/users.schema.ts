import { z, v } from "../../../utils/validation";

export const updateProfileSchema = z.object({
  name: v.text(2, 120).optional(),
  avatar: v.url().optional(),
});

export const addDocumentSchema = z.object({
  documentType: v.id().max(120),
  docUrl: v.url(),
});

export const usersSchemas = {
  updateProfileSchema,
  addDocumentSchema,
};

export default usersSchemas;

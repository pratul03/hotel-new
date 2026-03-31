import { z, v } from "../../../utils/validation";

export const preferencesSchema = z.object({
  inApp: v.bool().optional(),
  email: v.bool().optional(),
  push: v.bool().optional(),
  booking: v.bool().optional(),
  message: v.bool().optional(),
  payment: v.bool().optional(),
  marketing: v.bool().optional(),
});

export const notificationsSchemas = {
  preferencesSchema,
};

export default notificationsSchemas;

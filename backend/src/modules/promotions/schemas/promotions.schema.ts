import { z, v } from "../../../utils/validation";

export const validateSchema = z.object({
  code: v.text(2, 100),
  subtotal: v.number(0),
});

export const promotionsSchemas = {
  validateSchema,
};

export default promotionsSchemas;

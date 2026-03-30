import { Request } from "express";
import { validateSchema } from "../schemas/promotions.schema";

class PromotionsQueries {
  static validatePayload(req: Request) {
    return validateSchema.parse(req.body);
  }
}

export const promotionsQueries = PromotionsQueries;

export default promotionsQueries;

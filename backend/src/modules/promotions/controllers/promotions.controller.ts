import { Request, Response } from "express";
import { successResponse } from "../../../utils/response";
import { promotionsQueries } from "../queries/promotions.queries";
import { promotionService } from "../services/promotions.service";

export const promotionsController = {
  async list(_req: Request, res: Response) {
    const data = promotionService.list();
    res.json(successResponse(data, "Promotions listed"));
  },

  async validate(req: Request, res: Response) {
    const payload = promotionsQueries.validatePayload(req);
    const data = promotionService.validate(payload.code, payload.subtotal);
    res.json(successResponse(data, "Promotion validated"));
  },
};

export default promotionsController;

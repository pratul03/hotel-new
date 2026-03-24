import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { successResponse } from "../../../utils/response";
import { promotionService } from "../services/promotions.service";

const router = Router();

const validateSchema = z.object({
  code: z.string().min(2),
  subtotal: z.number().min(0),
});

router.get("/", (_req: Request, res: Response) => {
  const data = promotionService.list();
  res.json(successResponse(data, "Promotions listed"));
});

router.post("/validate", (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = validateSchema.parse(req.body);
    const data = promotionService.validate(payload.code, payload.subtotal);
    res.json(successResponse(data, "Promotion validated"));
  } catch (error) {
    next(error);
  }
});

export default router;


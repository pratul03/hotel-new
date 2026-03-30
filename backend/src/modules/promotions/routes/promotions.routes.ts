import { Router } from "express";
import { catchAsync } from "../../../utils";
import { promotionsController } from "../controllers/promotions.controller";

const router = Router();

router.get("/", catchAsync(promotionsController.list));

router.post("/validate", catchAsync(promotionsController.validate));

export default router;

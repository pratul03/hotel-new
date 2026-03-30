import { Router } from "express";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { searchhistoryController } from "../controllers/search-history.controller";

const router = Router();

router.post("/", authenticate, catchAsync(searchhistoryController.create));

router.get("/", authenticate, catchAsync(searchhistoryController.list));

router.delete("/", authenticate, catchAsync(searchhistoryController.clear));

export default router;

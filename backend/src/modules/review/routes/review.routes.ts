import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { reviewController } from "../controllers/review.controller";

const router = Router();

router.get("/", reviewController.getAll);

router.get("/booking/:bookingId", catchAsync(reviewController.getByBooking));

router.get("/:id", reviewController.getOne);

router.post("/", authenticate, catchAsync(reviewController.create));

router.put("/:id", authenticate, catchAsync(reviewController.update));

router.delete("/:id", authenticate, catchAsync(reviewController.delete));

export default router;

import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { roomController } from "../controllers/room.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB

// Create room (host only)
router.post(
  "/hotel/:hotelId",
  authenticate,
  requireRole(["host"]),
  catchAsync(roomController.create),
);

// Get room by ID
router.get("/:id", catchAsync(roomController.getById));

// Check availability
router.get("/:id/available", catchAsync(roomController.checkAvailability));

// Get pricing
router.get("/:id/pricing", catchAsync(roomController.getPricing));

// Update room (host only)
router.put(
  "/:id",
  authenticate,
  requireRole(["host"]),
  catchAsync(roomController.update),
);

// Delete room (host only)
router.delete(
  "/:id",
  authenticate,
  requireRole(["host"]),
  catchAsync(roomController.delete),
);

// Get presigned URL for image upload (host only)
router.get(
  "/:id/images/presigned-url",
  authenticate,
  requireRole(["host"]),
  catchAsync(roomController.getPresignedUrl),
);

// Upload image directly (host only, optional endpoint)
router.post(
  "/:id/images",
  authenticate,
  requireRole(["host"]),
  upload.single("image"),
  catchAsync(roomController.uploadImage),
);

// Delete image (host only)
router.delete(
  "/:id/images/:imageKey",
  authenticate,
  requireRole(["host"]),
  catchAsync(roomController.deleteImage),
);

export default router;

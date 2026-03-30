import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { hostprofileController } from "../controllers/host-profile.controller";

const router = Router();

// Get host profile (self)
router.get(
  "/profile",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostprofileController.getProfile),
);

// Create host profile
router.post(
  "/profile",
  authenticate,
  requireRole(["host"]),
  catchAsync(hostprofileController.createProfile),
);

// Update host profile
router.put(
  "/profile",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostprofileController.updateProfile),
);

export default router;

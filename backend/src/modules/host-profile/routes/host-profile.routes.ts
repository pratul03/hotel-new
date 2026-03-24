import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { hostProfileService } from "../services/host-profile.service";
import { successResponse } from "../../../utils/response";

const router = Router();

const profileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  businessType: z
    .enum(["agency", "chain", "management_company", "individual"])
    .optional(),
  description: z.string().max(1000).optional(),
});

const updateProfileSchema = profileSchema.partial();

// Get host profile (self)
router.get(
  "/profile",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await hostProfileService.getProfile(req.userId!);
      res.json(successResponse(profile, "Host profile retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

// Create host profile
router.post(
  "/profile",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = profileSchema.parse(req.body);
      const profile = await hostProfileService.createProfile(req.userId!, data);
      res.status(201).json(successResponse(profile, "Host profile created"));
    } catch (error) {
      next(error);
    }
  },
);

// Update host profile
router.put(
  "/profile",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const profile = await hostProfileService.updateProfile(req.userId!, data);
      res.json(successResponse(profile, "Host profile updated"));
    } catch (error) {
      next(error);
    }
  },
);

export default router;


import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils/response";
import { hostProfileService } from "../services/host-profile.service";
import { hostprofileQueries } from "../queries/host-profile.queries";
import {
  profileSchema,
  updateProfileSchema,
} from "../schemas/host-profile.schema";

export const hostprofileController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    const profile = await hostProfileService.getProfile(
      hostprofileQueries.userId(req) as string,
    );
    res.json(successResponse(profile, "Host profile retrieved"));
  },

  async createProfile(req: AuthenticatedRequest, res: Response) {
    const data = profileSchema.parse(req.body);
    const profile = await hostProfileService.createProfile(
      hostprofileQueries.userId(req) as string,
      data,
    );
    res.status(201).json(successResponse(profile, "Host profile created"));
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const data = updateProfileSchema.parse(req.body);
    const profile = await hostProfileService.updateProfile(
      hostprofileQueries.userId(req) as string,
      data,
    );
    res.json(successResponse(profile, "Host profile updated"));
  },
};

export default hostprofileController;

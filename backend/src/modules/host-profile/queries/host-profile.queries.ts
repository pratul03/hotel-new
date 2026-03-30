import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class HostProfileQueries {
  static userId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).userId;
  }
}

export const hostprofileQueries = HostProfileQueries;

export default hostprofileQueries;

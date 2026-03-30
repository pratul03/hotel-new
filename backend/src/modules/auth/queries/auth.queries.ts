import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class AuthQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).userId;
  }

  static sessionId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).sessionId;
  }
}

export const authQueries = AuthQueries;

export default authQueries;

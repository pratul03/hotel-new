import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class NotificationsQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string {
    return (req as AuthenticatedRequest).userId as string;
  }

  static id(req: Request): string {
    return this.getParam((req.params as { id?: string | string[] }).id);
  }
}

export const notificationsQueries = NotificationsQueries;

export default notificationsQueries;

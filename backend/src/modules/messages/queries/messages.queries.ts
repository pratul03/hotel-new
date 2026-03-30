import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class MessagesQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string {
    return (req as AuthenticatedRequest).userId as string;
  }

  static messageId(req: Request): string {
    return this.getParam((req.params as { id?: string | string[] }).id);
  }

  static otherUserId(req: Request): string {
    return this.getParam((req.params as { userId?: string | string[] }).userId);
  }
}

export const messagesQueries = MessagesQueries;

export default messagesQueries;

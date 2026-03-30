import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class WishlistQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static getQueryString(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      return typeof value[0] === "string" ? value[0] : undefined;
    }

    return typeof value === "string" ? value : undefined;
  }

  static userId(req: Request): string {
    return (req as AuthenticatedRequest).userId as string;
  }

  static roomId(req: Request): string {
    return this.getParam((req.params as { roomId?: string | string[] }).roomId);
  }

  static shareCode(req: Request): string {
    return this.getParam(
      (req.params as { shareCode?: string | string[] }).shareCode,
    );
  }

  static listName(req: Request): string | undefined {
    return this.getQueryString((req.query as { listName?: unknown }).listName);
  }
}

export const wishlistQueries = WishlistQueries;

export default wishlistQueries;

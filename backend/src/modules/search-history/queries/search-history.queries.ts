import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";

class SearchHistoryQueries {
  static userId(req: Request): string {
    return (req as AuthenticatedRequest).userId as string;
  }
}

export const searchhistoryQueries = SearchHistoryQueries;

export default searchhistoryQueries;

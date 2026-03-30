import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { hostFinanceQuerySchema } from "../schemas/host-finance.schema";

class HostFinanceQueries {
  static userId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).userId;
  }

  static listQuery(req: Request) {
    return hostFinanceQuerySchema.parse(req.query);
  }
}

export const hostfinanceQueries = HostFinanceQueries;

export default hostfinanceQueries;

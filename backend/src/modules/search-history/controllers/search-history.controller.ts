import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { searchhistoryQueries } from "../queries/search-history.queries";
import { createSchema } from "../schemas/search-history.schema";
import { searchHistoryService } from "../services/search-history.service";

export const searchhistoryController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const payload = createSchema.parse(req.body);
    const data = await searchHistoryService.add(
      searchhistoryQueries.userId(req),
      {
        queryLocation: payload.queryLocation,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        guests: payload.guests,
      },
    );

    res.status(201).json(successResponse(data, "Search history entry created"));
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const data = await searchHistoryService.list(
      searchhistoryQueries.userId(req),
    );
    res.json(successResponse(data, "Search history fetched"));
  },

  async clear(req: AuthenticatedRequest, res: Response) {
    const data = await searchHistoryService.clear(
      searchhistoryQueries.userId(req),
    );
    res.json(successResponse(data, "Search history cleared"));
  },
};

export default searchhistoryController;

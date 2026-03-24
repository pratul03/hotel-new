import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { catchAsync, successResponse } from '../../../utils';
import { searchHistoryService } from '../services/search-history.service';

const router = Router();

const createSchema = z.object({
  queryLocation: z.string().min(1),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  guests: z.number().int().positive().optional(),
});

router.post(
  '/',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = createSchema.parse(req.body);
    const data = await searchHistoryService.add(req.userId as string, {
      queryLocation: payload.queryLocation,
      checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
      checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
      guests: payload.guests,
    });
    res.status(201).json(successResponse(data, 'Search history entry created'));
  })
);

router.get(
  '/',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await searchHistoryService.list(req.userId as string);
    res.json(successResponse(data, 'Search history fetched'));
  })
);

router.delete(
  '/',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await searchHistoryService.clear(req.userId as string);
    res.json(successResponse(data, 'Search history cleared'));
  })
);

export default router;


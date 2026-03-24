import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { roomService } from "../services/room.service";
import { successResponse, errorResponse } from "../../../utils/response";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB

// Validation schemas
const createRoomSchema = z.object({
  roomType: z.string().min(1),
  capacity: z.number().int().positive(),
  maxGuests: z.number().int().positive(),
  basePrice: z.number().positive(),
  amenities: z.array(z.string()).optional(),
});

const updateRoomSchema = createRoomSchema.partial();

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

// Create room (host only)
router.post(
  "/hotel/:hotelId",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const data = createRoomSchema.parse(req.body);
      const hotelId = getParam(
        req.params.hotelId as string | string[] | undefined,
      );
      const room = await roomService.createRoom(hotelId, req.userId, data);

      res.status(201).json(successResponse(room, "Room created successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Get room by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = getParam(req.params.id as string | string[] | undefined);
    const room = await roomService.getRoomById(roomId);
    res.json(successResponse(room, "Room retrieved"));
  } catch (error) {
    next(error);
  }
});

// Check availability
router.get(
  "/:id/available",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkIn = new Date(req.query.checkIn as string);
      const checkOut = new Date(req.query.checkOut as string);

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return res
          .status(400)
          .json(errorResponse("INVALID_INPUT", "Invalid date format"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const availability = await roomService.checkAvailability(
        roomId,
        checkIn,
        checkOut,
      );

      res.json(successResponse(availability, "Availability checked"));
    } catch (error) {
      next(error);
    }
  },
);

// Get pricing
router.get(
  "/:id/pricing",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkIn = new Date(req.query.checkIn as string);
      const checkOut = new Date(req.query.checkOut as string);

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return res
          .status(400)
          .json(errorResponse("INVALID_INPUT", "Invalid date format"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const pricing = await roomService.getPricing(roomId, {
        checkIn,
        checkOut,
      });

      res.json(successResponse(pricing, "Pricing calculated"));
    } catch (error) {
      next(error);
    }
  },
);

// Update room (host only)
router.put(
  "/:id",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const data = updateRoomSchema.parse(req.body);
      const roomId = getParam(req.params.id as string | string[] | undefined);
      const room = await roomService.updateRoom(roomId, req.userId, data);

      res.json(successResponse(room, "Room updated successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Delete room (host only)
router.delete(
  "/:id",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const result = await roomService.deleteRoom(roomId, req.userId);

      res.json(successResponse(result, "Room deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Get presigned URL for image upload (host only)
router.get(
  "/:id/images/presigned-url",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const fileName = req.query.fileName as string;

      if (!fileName) {
        return res
          .status(400)
          .json(errorResponse("INVALID_INPUT", "fileName is required"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const result = await roomService.getPresignedUrl(
        roomId,
        req.userId,
        fileName,
      );

      res.json(successResponse(result, "Presigned URL generated"));
    } catch (error) {
      next(error);
    }
  },
);

// Upload image directly (host only, optional endpoint)
router.post(
  "/:id/images",
  authenticate,
  requireRole(["host"]),
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      if (!req.file) {
        return res
          .status(400)
          .json(errorResponse("INVALID_INPUT", "No file provided"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const result = await roomService.uploadImage(
        roomId,
        req.userId,
        req.file.originalname,
        req.file.buffer,
      );

      res
        .status(201)
        .json(successResponse(result, "Image uploaded successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Delete image (host only)
router.delete(
  "/:id/images/:imageKey",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const roomId = getParam(req.params.id as string | string[] | undefined);
      const imageKey = getParam(
        req.params.imageKey as string | string[] | undefined,
      );
      const result = await roomService.deleteImage(
        roomId,
        req.userId,
        imageKey,
      );

      res.json(successResponse(result, "Image deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

export default router;


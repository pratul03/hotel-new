import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { errorResponse, successResponse } from "../../../utils/response";
import { roomQueries } from "../queries/room.queries";
import { createRoomSchema, updateRoomSchema } from "../schemas/room.schema";
import { roomService } from "../services/room.service";

export const roomController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(
      roomQueries.hotelId(req),
      userId,
      data,
    );
    res.status(201).json(successResponse(room, "Room created successfully"));
  },

  async getById(req: Request, res: Response) {
    const room = await roomService.getRoomById(roomQueries.id(req));
    res.json(successResponse(room, "Room retrieved"));
  },

  async checkAvailability(req: Request, res: Response) {
    const { checkIn, checkOut } = roomQueries.dateRange(req);
    const availability = await roomService.checkAvailability(
      roomQueries.id(req),
      checkIn,
      checkOut,
    );
    res.json(successResponse(availability, "Availability checked"));
  },

  async getPricing(req: Request, res: Response) {
    const { checkIn, checkOut } = roomQueries.dateRange(req);
    const pricing = await roomService.getPricing(roomQueries.id(req), {
      checkIn,
      checkOut,
    });
    res.json(successResponse(pricing, "Pricing calculated"));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = updateRoomSchema.parse(req.body);
    const room = await roomService.updateRoom(
      roomQueries.id(req),
      userId,
      data,
    );
    res.json(successResponse(room, "Room updated successfully"));
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const result = await roomService.deleteRoom(roomQueries.id(req), userId);
    res.json(successResponse(result, "Room deleted successfully"));
  },

  async getPresignedUrl(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const result = await roomService.getPresignedUrl(
      roomQueries.id(req),
      userId,
      roomQueries.fileName(req),
    );
    res.json(successResponse(result, "Presigned URL generated"));
  },

  async uploadImage(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const file = (
      req as AuthenticatedRequest & {
        file?: { originalname: string; buffer: Buffer };
      }
    ).file;
    if (!file) {
      res.status(400).json(errorResponse("INVALID_INPUT", "No file provided"));
      return;
    }

    const result = await roomService.uploadImage(
      roomQueries.id(req),
      userId,
      file.originalname,
      file.buffer,
    );
    res
      .status(201)
      .json(successResponse(result, "Image uploaded successfully"));
  },

  async deleteImage(req: AuthenticatedRequest, res: Response) {
    const userId = roomQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const result = await roomService.deleteImage(
      roomQueries.id(req),
      userId,
      roomQueries.imageKey(req),
    );
    res.json(successResponse(result, "Image deleted successfully"));
  },
};

export default roomController;

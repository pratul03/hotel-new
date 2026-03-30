import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import {
  presignedUrlQuerySchema,
  roomDateRangeQuerySchema,
} from "../schemas/room.schema";

class RoomQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).userId;
  }

  static id(req: Request): string {
    return this.getParam((req.params as { id?: string | string[] }).id);
  }

  static hotelId(req: Request): string {
    return this.getParam(
      (req.params as { hotelId?: string | string[] }).hotelId,
    );
  }

  static imageKey(req: Request): string {
    return this.getParam(
      (req.params as { imageKey?: string | string[] }).imageKey,
    );
  }

  static dateRange(req: Request): { checkIn: Date; checkOut: Date } {
    const payload = roomDateRangeQuerySchema.parse(req.query);
    return {
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
    };
  }

  static fileName(req: Request): string {
    const payload = presignedUrlQuerySchema.parse(req.query);
    return payload.fileName;
  }
}

export const roomQueries = RoomQueries;

export default roomQueries;

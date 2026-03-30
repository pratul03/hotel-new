import { Request } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { searchHotelsSchema } from "../schemas/hotel.schema";

class HotelQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).userId;
  }

  static hotelId(req: Request): string {
    return this.getParam((req.params as { id?: string | string[] }).id);
  }

  static sourceId(req: Request): string {
    return this.getParam(
      (req.params as { sourceId?: string | string[] }).sourceId,
    );
  }

  static firstOrUndefined(
    value: string | string[] | undefined,
  ): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  static numberOrUndefined(
    value: string | string[] | undefined,
  ): number | undefined {
    const raw = this.firstOrUndefined(value);
    if (!raw) return undefined;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  static booleanOrUndefined(
    value: string | string[] | undefined,
  ): boolean | undefined {
    const raw = this.firstOrUndefined(value);
    if (typeof raw !== "string") return undefined;

    if (["true", "1", "yes"].includes(raw.toLowerCase())) return true;
    if (["false", "0", "no"].includes(raw.toLowerCase())) return false;
    return undefined;
  }

  static searchParams(req: Request) {
    return searchHotelsSchema.parse({
      latitude: this.numberOrUndefined(
        (req.query.latitude as string | string[] | undefined) ??
          (req.query.lat as string | string[] | undefined),
      ),
      longitude: this.numberOrUndefined(
        (req.query.longitude as string | string[] | undefined) ??
          (req.query.lng as string | string[] | undefined),
      ),
      radiusKm:
        this.numberOrUndefined(
          (req.query.radiusKm as string | string[] | undefined) ??
            (req.query.radius as string | string[] | undefined),
        ) ?? 10,
      checkIn: this.firstOrUndefined(
        req.query.checkIn as string | string[] | undefined,
      ),
      checkOut: this.firstOrUndefined(
        req.query.checkOut as string | string[] | undefined,
      ),
      guests: this.numberOrUndefined(
        req.query.guests as string | string[] | undefined,
      ),
      minPrice: this.numberOrUndefined(
        req.query.minPrice as string | string[] | undefined,
      ),
      maxPrice: this.numberOrUndefined(
        req.query.maxPrice as string | string[] | undefined,
      ),
      instantBooking: this.booleanOrUndefined(
        req.query.instantBooking as string | string[] | undefined,
      ),
      minRating: this.numberOrUndefined(
        req.query.minRating as string | string[] | undefined,
      ),
      accessibility: this.firstOrUndefined(
        req.query.accessibility as string | string[] | undefined,
      ),
      north: this.numberOrUndefined(
        req.query.north as string | string[] | undefined,
      ),
      south: this.numberOrUndefined(
        req.query.south as string | string[] | undefined,
      ),
      east: this.numberOrUndefined(
        req.query.east as string | string[] | undefined,
      ),
      west: this.numberOrUndefined(
        req.query.west as string | string[] | undefined,
      ),
      sortBy: this.firstOrUndefined(
        req.query.sortBy as string | string[] | undefined,
      ),
      page:
        this.numberOrUndefined(
          req.query.page as string | string[] | undefined,
        ) ?? 1,
      limit:
        this.numberOrUndefined(
          req.query.limit as string | string[] | undefined,
        ) ?? 10,
    });
  }
}

export const hotelQueries = HotelQueries;

export default hotelQueries;

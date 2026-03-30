import { Request } from "express";

class BookingQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static id(req: Request): string {
    return this.getParam(req.params.id as string | string[] | undefined);
  }
}

export const bookingQueries = BookingQueries;

export default bookingQueries;

import { Request } from "express";
import {
  analyticsQuerySchema,
  auditExportQuerySchema,
} from "../schemas/host-tools.schema";

class HostToolsQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static hotelId(req: Request): string {
    return this.getParam(req.params.hotelId as string | string[] | undefined);
  }

  static id(req: Request): string {
    return this.getParam(req.params.id as string | string[] | undefined);
  }

  static assignmentId(req: Request): string {
    return this.getParam(
      req.params.assignmentId as string | string[] | undefined,
    );
  }

  static analytics(req: Request) {
    return analyticsQuerySchema.parse(req.query);
  }

  static auditExport(req: Request) {
    return auditExportQuerySchema.parse(req.query);
  }
}

export const hosttoolsQueries = HostToolsQueries;

export default hosttoolsQueries;

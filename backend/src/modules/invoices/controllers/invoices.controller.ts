import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { invoicingService } from "../services/invoicing.service";
import {
  accessUrlSchema,
  createInvoiceSchema,
  listFilterSchema,
  storageAuditSchema,
} from "../schemas/invoices.schema";

const revokeInvoiceSchema = z.object({
  reason: z.string().trim().min(2).max(255).optional(),
});

export const invoicesController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const payload = createInvoiceSchema.parse(req.body);
    const data = await invoicingService.createDocument(req.userId, payload);
    res.status(201).json(successResponse(data, "Invoice document created"));
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const query = listFilterSchema.parse(req.query);
    const data = await invoicingService.listDocuments(req.userId, query);
    res.json(successResponse(data, "Invoice documents fetched"));
  },

  async getPdf(req: AuthenticatedRequest, res: Response) {
    const data = await invoicingService.getDocumentPdf(
      req.userId,
      req.params.id as string,
    );

    res.setHeader("Content-Type", data.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.fileName}"`,
    );
    res.send(data.buffer);
  },

  async getAccessUrl(req: AuthenticatedRequest, res: Response) {
    const query = accessUrlSchema.parse(req.query);
    const data = await invoicingService.getDocumentAccessUrl(
      req.userId,
      req.params.id as string,
      query.expiresIn,
    );
    res.json(successResponse(data, "Invoice access URL fetched"));
  },

  async runStorageAudit(req: AuthenticatedRequest, res: Response) {
    const payload = storageAuditSchema.parse(req.body ?? {});
    const data = await invoicingService.auditStorageHealth(req.userId, payload);
    res.json(successResponse(data, "Invoice storage audit completed"));
  },

  async revoke(req: AuthenticatedRequest, res: Response) {
    const payload = revokeInvoiceSchema.parse(req.body ?? {});

    const data = await invoicingService.revokeDocument(
      req.userId,
      req.params.id as string,
      payload.reason,
    );
    res.json(successResponse(data, "Invoice document revoked"));
  },
};

export default invoicesController;

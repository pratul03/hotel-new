"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesController = void 0;
const zod_1 = require("zod");
const utils_1 = require("../../../utils");
const invoicing_service_1 = require("../services/invoicing.service");
const invoices_schema_1 = require("../schemas/invoices.schema");
const revokeInvoiceSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(2).max(255).optional(),
});
exports.invoicesController = {
    async create(req, res) {
        const payload = invoices_schema_1.createInvoiceSchema.parse(req.body);
        const data = await invoicing_service_1.invoicingService.createDocument(req.userId, payload);
        res.status(201).json((0, utils_1.successResponse)(data, "Invoice document created"));
    },
    async list(req, res) {
        const query = invoices_schema_1.listFilterSchema.parse(req.query);
        const data = await invoicing_service_1.invoicingService.listDocuments(req.userId, query);
        res.json((0, utils_1.successResponse)(data, "Invoice documents fetched"));
    },
    async getPdf(req, res) {
        const data = await invoicing_service_1.invoicingService.getDocumentPdf(req.userId, req.params.id);
        res.setHeader("Content-Type", data.contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${data.fileName}"`);
        res.send(data.buffer);
    },
    async getAccessUrl(req, res) {
        const query = invoices_schema_1.accessUrlSchema.parse(req.query);
        const data = await invoicing_service_1.invoicingService.getDocumentAccessUrl(req.userId, req.params.id, query.expiresIn);
        res.json((0, utils_1.successResponse)(data, "Invoice access URL fetched"));
    },
    async runStorageAudit(req, res) {
        const payload = invoices_schema_1.storageAuditSchema.parse(req.body ?? {});
        const data = await invoicing_service_1.invoicingService.auditStorageHealth(req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "Invoice storage audit completed"));
    },
    async revoke(req, res) {
        const payload = revokeInvoiceSchema.parse(req.body ?? {});
        const data = await invoicing_service_1.invoicingService.revokeDocument(req.userId, req.params.id, payload.reason);
        res.json((0, utils_1.successResponse)(data, "Invoice document revoked"));
    },
};
exports.default = exports.invoicesController;

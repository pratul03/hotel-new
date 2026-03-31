"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commerceMutationResolvers = void 0;
const invoices_schema_1 = require("../../../../domains/invoices/schemas/invoices.schema");
const invoicing_service_1 = require("../../../../domains/invoices/services/invoicing.service");
const promotions_schema_1 = require("../../../../domains/promotions/schemas/promotions.schema");
const promotions_service_1 = require("../../../../domains/promotions/services/promotions.service");
const search_history_schema_1 = require("../../../../domains/search-history/schemas/search-history.schema");
const search_history_service_1 = require("../../../../domains/search-history/services/search-history.service");
const context_1 = require("../../../context");
exports.commerceMutationResolvers = {
    validatePromotion: async (_parent, args) => {
        const parsed = promotions_schema_1.validateSchema.parse(args.input);
        return promotions_service_1.promotionService.validate(parsed.code, parsed.subtotal);
    },
    addSearchHistory: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = search_history_schema_1.createSchema.parse(args.input);
        return search_history_service_1.searchHistoryService.add(auth.userId, {
            queryLocation: parsed.queryLocation,
            checkIn: parsed.checkIn ? new Date(parsed.checkIn) : undefined,
            checkOut: parsed.checkOut ? new Date(parsed.checkOut) : undefined,
            guests: parsed.guests,
        });
    },
    clearSearchHistory: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        await search_history_service_1.searchHistoryService.clear(auth.userId);
        return { deleted: true, message: "Search history cleared" };
    },
    createInvoice: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = invoices_schema_1.createInvoiceSchema.parse(args.input);
        return invoicing_service_1.invoicingService.createDocument(auth.userId, parsed);
    },
    revokeInvoice: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return invoicing_service_1.invoicingService.revokeDocument(auth.userId, args.invoiceId, args.reason);
    },
    runInvoiceStorageAudit: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = invoices_schema_1.storageAuditSchema.parse(args.input || {});
        return invoicing_service_1.invoicingService.auditStorageHealth(auth.userId, parsed);
    },
};

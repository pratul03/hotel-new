"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commerceQueryResolvers = void 0;
const invoicing_service_1 = require("../../../../domains/invoices/services/invoicing.service");
const invoices_schema_1 = require("../../../../domains/invoices/schemas/invoices.schema");
const promotions_service_1 = require("../../../../domains/promotions/services/promotions.service");
const search_history_service_1 = require("../../../../domains/search-history/services/search-history.service");
const context_1 = require("../../../context");
exports.commerceQueryResolvers = {
    promotions: async () => promotions_service_1.promotionService.list(),
    searchHistory: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return search_history_service_1.searchHistoryService.list(auth.userId);
    },
    invoices: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = invoices_schema_1.listFilterSchema.parse(args);
        return invoicing_service_1.invoicingService.listDocuments(auth.userId, parsed);
    },
    invoiceAccessUrl: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = invoices_schema_1.accessUrlSchema.parse({ expiresIn: args.expiresIn });
        return invoicing_service_1.invoicingService.getDocumentAccessUrl(auth.userId, args.invoiceId, parsed.expiresIn);
    },
};

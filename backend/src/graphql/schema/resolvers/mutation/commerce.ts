import {
  createInvoiceSchema,
  storageAuditSchema,
} from "../../../../domains/invoices/schemas/invoices.schema";
import { invoicingService } from "../../../../domains/invoices/services/invoicing.service";
import { validateSchema as validatePromotionSchema } from "../../../../domains/promotions/schemas/promotions.schema";
import { promotionService } from "../../../../domains/promotions/services/promotions.service";
import { createSchema as createSearchHistorySchema } from "../../../../domains/search-history/schemas/search-history.schema";
import { searchHistoryService } from "../../../../domains/search-history/services/search-history.service";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";

export const commerceMutationResolvers = {
  validatePromotion: async (_parent: unknown, args: { input: unknown }) => {
    const parsed = validatePromotionSchema.parse(args.input);
    return promotionService.validate(parsed.code, parsed.subtotal);
  },

  addSearchHistory: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createSearchHistorySchema.parse(args.input);
    return searchHistoryService.add(auth.userId, {
      queryLocation: parsed.queryLocation,
      checkIn: parsed.checkIn ? new Date(parsed.checkIn) : undefined,
      checkOut: parsed.checkOut ? new Date(parsed.checkOut) : undefined,
      guests: parsed.guests,
    });
  },

  clearSearchHistory: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    await searchHistoryService.clear(auth.userId);
    return { deleted: true, message: "Search history cleared" };
  },

  createInvoice: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createInvoiceSchema.parse(args.input);
    return invoicingService.createDocument(auth.userId, parsed);
  },

  revokeInvoice: async (
    _parent: unknown,
    args: { invoiceId: string; reason?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return invoicingService.revokeDocument(
      auth.userId,
      args.invoiceId,
      args.reason,
    );
  },

  runInvoiceStorageAudit: async (
    _parent: unknown,
    args: { input?: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = storageAuditSchema.parse(args.input || {});
    return invoicingService.auditStorageHealth(auth.userId, parsed);
  },
};

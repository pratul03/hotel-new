import { invoicingService } from "../../../../domains/invoices/services/invoicing.service";
import {
  accessUrlSchema,
  listFilterSchema as invoiceListFilterSchema,
} from "../../../../domains/invoices/schemas/invoices.schema";
import { promotionService } from "../../../../domains/promotions/services/promotions.service";
import { searchHistoryService } from "../../../../domains/search-history/services/search-history.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const commerceQueryResolvers = {
  promotions: async () => promotionService.list(),

  searchHistory: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return searchHistoryService.list(auth.userId);
  },

  invoices: async (
    _parent: unknown,
    args: { type?: string; status?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = invoiceListFilterSchema.parse(args);
    return invoicingService.listDocuments(auth.userId, parsed);
  },

  invoiceAccessUrl: async (
    _parent: unknown,
    args: { invoiceId: string; expiresIn?: number },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = accessUrlSchema.parse({ expiresIn: args.expiresIn });
    return invoicingService.getDocumentAccessUrl(
      auth.userId,
      args.invoiceId,
      parsed.expiresIn,
    );
  },
};

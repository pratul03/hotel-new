import { toIsoString, toMetadataEntries, toUnknownArray } from "../../helpers";

export const commerceTypeResolvers = {
  SearchHistoryItem: {
    checkIn: (item: { checkIn?: unknown }) => toIsoString(item.checkIn),
    checkOut: (item: { checkOut?: unknown }) => toIsoString(item.checkOut),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
  },

  InvoiceDocument: {
    lineItems: (item: { lineItems?: unknown }) => {
      const entries = toUnknownArray(item.lineItems);
      return entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const parsed = entry as { description?: unknown; amount?: unknown };
          return {
            description: String(parsed.description ?? ""),
            amount: Number(parsed.amount ?? 0),
          };
        });
    },
    metadata: (item: { metadata?: unknown }) =>
      toMetadataEntries(item.metadata),
    issuedAt: (item: { issuedAt?: unknown }) => toIsoString(item.issuedAt),
    revokedAt: (item: { revokedAt?: unknown }) => toIsoString(item.revokedAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  Review: {
    categories: (item: { categories?: unknown }) =>
      toMetadataEntries(item.categories),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },
};

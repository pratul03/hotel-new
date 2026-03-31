"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commerceTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.commerceTypeResolvers = {
    SearchHistoryItem: {
        checkIn: (item) => (0, helpers_1.toIsoString)(item.checkIn),
        checkOut: (item) => (0, helpers_1.toIsoString)(item.checkOut),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
    },
    InvoiceDocument: {
        lineItems: (item) => {
            const entries = (0, helpers_1.toUnknownArray)(item.lineItems);
            return entries
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => {
                const parsed = entry;
                return {
                    description: String(parsed.description ?? ""),
                    amount: Number(parsed.amount ?? 0),
                };
            });
        },
        metadata: (item) => (0, helpers_1.toMetadataEntries)(item.metadata),
        issuedAt: (item) => (0, helpers_1.toIsoString)(item.issuedAt),
        revokedAt: (item) => (0, helpers_1.toIsoString)(item.revokedAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    Review: {
        categories: (item) => (0, helpers_1.toMetadataEntries)(item.categories),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
};

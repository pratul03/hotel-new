"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.hostTypeResolvers = {
    HostProfile: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HostTransaction: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        checkIn: (item) => (0, helpers_1.toIsoString)(item.checkIn),
        checkOut: (item) => (0, helpers_1.toIsoString)(item.checkOut),
    },
    HostPayoutAccount: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HostPayout: {
        requestedAt: (item) => (0, helpers_1.toIsoString)(item.requestedAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    CancellationPolicy: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    QuickReplyTemplate: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    ScheduledMessage: {
        sendAt: (item) => (0, helpers_1.toIsoString)(item.sendAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    CoHostAssignment: {
        permissions: (item) => (0, helpers_1.toArray)(item.permissions),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HotelComplianceChecklist: {
        checklistItems: (item) => {
            const entries = (0, helpers_1.toUnknownArray)(item.checklistItems);
            return entries
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => {
                const parsed = entry;
                return {
                    label: String(parsed.label ?? ""),
                    completed: Boolean(parsed.completed),
                };
            });
        },
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HotelListingToolkit: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HostClaimBooking: {
        checkIn: (item) => (0, helpers_1.toIsoString)(item.checkIn),
        checkOut: (item) => (0, helpers_1.toIsoString)(item.checkOut),
    },
    HostClaim: {
        evidenceUrls: (item) => (0, helpers_1.toArray)(item.evidenceUrls),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
};

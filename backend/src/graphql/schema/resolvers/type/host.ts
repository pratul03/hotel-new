import { toArray, toIsoString, toUnknownArray } from "../../helpers";

export const hostTypeResolvers = {
  HostProfile: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HostTransaction: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    checkIn: (item: { checkIn?: unknown }) => toIsoString(item.checkIn),
    checkOut: (item: { checkOut?: unknown }) => toIsoString(item.checkOut),
  },

  HostPayoutAccount: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HostPayout: {
    requestedAt: (item: { requestedAt?: unknown }) =>
      toIsoString(item.requestedAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  CancellationPolicy: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  QuickReplyTemplate: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  ScheduledMessage: {
    sendAt: (item: { sendAt?: unknown }) => toIsoString(item.sendAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  CoHostAssignment: {
    permissions: (item: { permissions?: unknown }) => toArray(item.permissions),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HotelComplianceChecklist: {
    checklistItems: (item: { checklistItems?: unknown }) => {
      const entries = toUnknownArray(item.checklistItems);
      return entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const parsed = entry as { label?: unknown; completed?: unknown };
          return {
            label: String(parsed.label ?? ""),
            completed: Boolean(parsed.completed),
          };
        });
    },
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HotelListingToolkit: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HostClaimBooking: {
    checkIn: (item: { checkIn?: unknown }) => toIsoString(item.checkIn),
    checkOut: (item: { checkOut?: unknown }) => toIsoString(item.checkOut),
  },

  HostClaim: {
    evidenceUrls: (item: { evidenceUrls?: unknown }) =>
      toArray(item.evidenceUrls),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },
};

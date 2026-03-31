import { toIsoString } from "../../helpers";

export const accountTypeResolvers = {
  SessionRecord: {
    createdAt: (record: { createdAt?: unknown }) =>
      toIsoString(record.createdAt),
    lastSeenAt: (record: { lastSeenAt?: unknown }) =>
      toIsoString(record.lastSeenAt),
  },

  UserDocument: {
    createdAt: (doc: { createdAt?: unknown }) => toIsoString(doc.createdAt),
  },

  HostVerification: {
    approvedAt: (item: { approvedAt?: unknown }) =>
      toIsoString(item.approvedAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  IdentityDocument: {
    createdAt: (doc: { createdAt?: unknown }) => toIsoString(doc.createdAt),
  },
};

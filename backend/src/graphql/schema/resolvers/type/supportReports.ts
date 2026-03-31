import { toArray, toIsoString } from "../../helpers";

export const supportReportsTypeResolvers = {
  SupportTicket: {
    createdAt: (ticket: { createdAt?: unknown }) =>
      toIsoString(ticket.createdAt),
    updatedAt: (ticket: { updatedAt?: unknown }) =>
      toIsoString(ticket.updatedAt),
  },

  RoutingTicket: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
  },

  RoutingIncident: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
  },

  IncidentReport: {
    resolvedAt: (item: { resolvedAt?: unknown }) =>
      toIsoString(item.resolvedAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  ChargebackCase: {
    evidenceUrls: (item: { evidenceUrls?: unknown }) =>
      toArray(item.evidenceUrls),
    timeline: (item: { timeline?: unknown }) => toArray(item.timeline),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
  },

  OffPlatformFeeCase: {
    evidenceUrls: (item: { evidenceUrls?: unknown }) =>
      toArray(item.evidenceUrls),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },
};

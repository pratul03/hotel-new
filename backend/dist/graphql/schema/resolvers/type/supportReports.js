"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportReportsTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.supportReportsTypeResolvers = {
    SupportTicket: {
        createdAt: (ticket) => (0, helpers_1.toIsoString)(ticket.createdAt),
        updatedAt: (ticket) => (0, helpers_1.toIsoString)(ticket.updatedAt),
    },
    RoutingTicket: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
    },
    RoutingIncident: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
    },
    IncidentReport: {
        resolvedAt: (item) => (0, helpers_1.toIsoString)(item.resolvedAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    ChargebackCase: {
        evidenceUrls: (item) => (0, helpers_1.toArray)(item.evidenceUrls),
        timeline: (item) => (0, helpers_1.toArray)(item.timeline),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
    },
    OffPlatformFeeCase: {
        evidenceUrls: (item) => (0, helpers_1.toArray)(item.evidenceUrls),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportReportsTypeDefs = void 0;
exports.supportReportsTypeDefs = `
  type SupportTicket {
    id: ID!
    userId: ID
    subject: String
    description: String
    priority: String
    status: String
    reply: String
    createdAt: String
    updatedAt: String
  }

  type EmergencyTicketResult {
    ticket: SupportTicket!
    escalationStage: String!
    immediateSteps: [String!]!
  }

  type RoutingTicket {
    id: ID!
    subject: String
    status: String
    createdAt: String
  }

  type RoutingIncident {
    id: ID!
    description: String
    status: String
    createdAt: String
  }

  type SupportRoutingQueue {
    urgentSupportTickets: [RoutingTicket!]!
    activeIncidents: [RoutingIncident!]!
  }

  type SupportRoutingSuggestions {
    trustAndSafetyPod: Int!
    frontlineSupport: Int!
    externalEscalationRequired: Int!
  }

  type SupportRoutingConsole {
    generatedAt: String!
    lookbackDays: Int!
    queue: SupportRoutingQueue!
    routingSuggestions: SupportRoutingSuggestions!
  }

  type SupportOpsMetric {
    total: Int!
    resolved: Int!
    slaResolutionRate: Float!
  }

  type SupportSafetyMetric {
    totalIncidents: Int!
    resolved: Int!
    resolvedWithin24h: Int!
    slaResolutionRate: Float!
  }

  type SupportOpsDashboard {
    generatedAt: String!
    lookbackDays: Int!
    support: SupportOpsMetric!
    safety: SupportSafetyMetric!
  }

  type IncidentBookingHotel {
    id: ID
    name: String
    ownerId: ID
  }

  type IncidentBookingRoom {
    hotel: IncidentBookingHotel
  }

  type IncidentBooking {
    id: ID
    userId: ID
    room: IncidentBookingRoom
  }

  type IncidentReport {
    id: ID!
    bookingId: ID
    reportedByUserId: ID
    description: String
    status: String
    resolution: String
    resolvedAt: String
    createdAt: String
    updatedAt: String
    reportedBy: UserLite
    booking: IncidentBooking
  }

  type ChargebackCase {
    id: ID!
    userId: ID
    bookingId: ID
    amount: Float
    status: String
    reason: String
    evidenceUrls: [String!]!
    timeline: [String!]!
    createdAt: String
  }

  type AirCoverBoard {
    generatedAt: String!
    incidents: [IncidentReport!]!
    emergencyTickets: [SupportTicket!]!
    chargebackCases: [ChargebackCase!]!
  }

  type OffPlatformFeeCase {
    id: ID!
    bookingId: ID
    reporterUserId: ID
    description: String
    status: String
    evidenceUrls: [String!]!
    createdAt: String
    updatedAt: String
  }`;

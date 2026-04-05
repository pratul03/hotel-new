export type AdminVerificationStatus = "verified" | "in_review" | "pending";

export type AdminCaseType = "incident" | "chargeback" | "off_platform_fee";

export type AdminUserRole = "guest" | "host" | "admin";

export interface AdminPromotionRule {
  code: string;
  description: string;
  minSubtotal: number;
}

export interface AdminHotelInventoryRow {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  name: string;
  location: string;
  isPromoted: boolean;
  promotedUntil?: string;
  checkInTime?: string;
  instantBooking: boolean;
  responseRate: number | null;
  superhost: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserManagementRow {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: AdminUserRole;
  verified: boolean;
  listingsCount: number;
  promotedListingsCount: number;
  superhost: boolean;
  responseRate: number | null;
  lastActivityAt: string;
  health: "healthy" | "watch" | "needs_attention";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminVerificationQueueRow {
  id: string;
  hostName: string;
  listingsCount: number;
  responseRate: number | null;
  superhost: boolean;
  status: AdminVerificationStatus;
  reason: string;
  lastActivityAt: string;
}

export interface AdminRoutingTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface AdminRoutingIncident {
  id: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface AdminSupportRoutingConsole {
  generatedAt: string;
  lookbackDays: number;
  queue: {
    urgentSupportTickets: AdminRoutingTicket[];
    activeIncidents: AdminRoutingIncident[];
  };
  routingSuggestions: {
    trustAndSafetyPod: number;
    frontlineSupport: number;
    externalEscalationRequired: number;
  };
}

export interface AdminSupportOpsDashboard {
  generatedAt: string;
  lookbackDays: number;
  support: {
    total: number;
    resolved: number;
    slaResolutionRate: number;
  };
  safety: {
    totalIncidents: number;
    resolved: number;
    resolvedWithin24h: number;
    slaResolutionRate: number;
  };
}

export interface AdminChargebackCase {
  id: string;
  userId?: string;
  bookingId?: string;
  amount?: number;
  status?: string;
  reason?: string;
  createdAt?: string;
}

export interface AdminOffPlatformFeeCase {
  id: string;
  bookingId?: string;
  reporterUserId?: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface AdminAirCoverBoard {
  generatedAt: string;
  incidents: Array<{
    id: string;
    bookingId?: string;
    reportedByUserId?: string;
    description?: string;
    status?: string;
    createdAt?: string;
  }>;
  emergencyTickets: Array<{
    id: string;
    userId?: string;
    subject?: string;
    status?: string;
    priority?: string;
    createdAt?: string;
  }>;
  chargebackCases: AdminChargebackCase[];
}

export interface AdminIncident {
  id: string;
  bookingId?: string;
  reportedByUserId?: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface AdminBookingCaseRow {
  id: string;
  caseType: AdminCaseType;
  bookingId?: string;
  userId?: string;
  title: string;
  status: string;
  amount?: number;
  createdAt: string;
}

export interface AdminPaymentQueueSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  refunded: number;
  queued: number;
  staleProcessing: number;
}

export interface AdminFxRate {
  id?: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  provider?: string;
  effectiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminReprocessResult {
  dryRun: boolean;
  olderThanMinutes: number;
  scanned: number;
  processedCount: number;
  skippedCount: number;
  processedPaymentIds: string[];
  skippedPaymentIds: string[];
  candidates: Array<{
    paymentId?: string;
    bookingId?: string;
    updatedAt?: string;
  }>;
}

export interface AdminInventorySnapshot {
  hotels: AdminHotelInventoryRow[];
  users: AdminUserManagementRow[];
  verificationQueue: AdminVerificationQueueRow[];
}

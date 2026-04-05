import axiosInstance from "@/lib/axios";
import {
  AdminAirCoverBoard,
  AdminBookingCaseRow,
  AdminFxRate,
  AdminHotelInventoryRow,
  AdminIncident,
  AdminInventorySnapshot,
  AdminOffPlatformFeeCase,
  AdminPaymentQueueSummary,
  AdminPromotionRule,
  AdminReprocessResult,
  AdminSupportOpsDashboard,
  AdminSupportRoutingConsole,
  AdminUserManagementRow,
  AdminVerificationQueueRow,
} from "@/types/admin";
import {
  AdminGraphqlGateway,
  adminGraphqlGateway,
} from "./AdminGraphqlGateway";

type SearchHotelsResponse = {
  data: Array<{
    id: string;
    ownerId: string;
    name: string;
    location: string;
    checkInTime?: string;
    instantBooking: boolean;
    isPromoted?: boolean;
    promotedUntil?: string;
    createdAt: string;
    updatedAt: string;
    owner?: {
      id: string;
      name: string;
      avatar?: string;
      superhost: boolean;
      responseRate?: number;
    };
  }>;
  total?: number;
  pages?: number;
};

type AdminUsersConnectionResponse = {
  data: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: "guest" | "host" | "admin";
    verified: boolean;
    superhost: boolean;
    responseRate?: number | null;
    listingsCount: number;
    promotedListingsCount: number;
    lastActivityAt: string;
    health?: AdminUserManagementRow["health"];
    createdAt?: string;
    updatedAt?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  pages: number;
};

abstract class AdminServiceBase {
  constructor(protected readonly gateway: AdminGraphqlGateway) {}
}

export class InventoryAdminService extends AdminServiceBase {
  async getPromotions(): Promise<AdminPromotionRule[]> {
    return this.gateway.request<AdminPromotionRule[]>(
      "promotions",
      `query Promotions { promotions { code description minSubtotal } }`,
    );
  }

  async getHotelsSnapshot(limit = 200): Promise<AdminHotelInventoryRow[]> {
    const { data } = await axiosInstance.get<SearchHotelsResponse>(
      "/hotels/search",
      {
        params: {
          latitude: 20.5937,
          longitude: 78.9629,
          radiusKm: 10000,
          page: 1,
          limit,
          sortBy: "recommended",
        },
      },
    );

    const hotels = data?.data ?? [];

    return hotels.map((hotel) => ({
      id: hotel.id,
      ownerId: hotel.owner?.id ?? hotel.ownerId,
      ownerName: hotel.owner?.name ?? "Unknown Host",
      ownerAvatar: hotel.owner?.avatar,
      name: hotel.name,
      location: hotel.location,
      isPromoted: Boolean(hotel.isPromoted),
      promotedUntil: hotel.promotedUntil,
      checkInTime: hotel.checkInTime,
      instantBooking: hotel.instantBooking,
      responseRate: hotel.owner?.responseRate ?? null,
      superhost: Boolean(hotel.owner?.superhost),
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt,
    }));
  }

  async getInventorySnapshot(limit = 200): Promise<AdminInventorySnapshot> {
    const [hotels, remoteUsers] = await Promise.all([
      this.getHotelsSnapshot(limit),
      this.getAdminUsers({ limit }),
    ]);

    const users = remoteUsers.length > 0 ? remoteUsers : this.buildUserRows(hotels);
    const verificationQueue = this.buildVerificationRows(users);

    return {
      hotels,
      users,
      verificationQueue,
    };
  }

  async getAdminUsers(input?: {
    search?: string;
    role?: "guest" | "host" | "admin";
    verified?: boolean;
    superhost?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AdminUserManagementRow[]> {
    const response = await this.gateway.request<AdminUsersConnectionResponse>(
      "adminUsers",
      `query AdminUsers($input: AdminUsersFilterInput) {
        adminUsers(input: $input) {
          data {
            id
            name
            email
            avatar
            role
            verified
            superhost
            responseRate
            listingsCount
            promotedListingsCount
            lastActivityAt
            health
            createdAt
            updatedAt
          }
          total
          page
          limit
          pages
        }
      }`,
      { input: input ?? { limit: 200, page: 1 } },
    );

    return response.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      verified: Boolean(user.verified),
      listingsCount: user.listingsCount,
      promotedListingsCount: user.promotedListingsCount,
      superhost: Boolean(user.superhost),
      responseRate:
        typeof user.responseRate === "number" ? user.responseRate : null,
      lastActivityAt: user.lastActivityAt,
      health:
        user.health ??
        this.getHealthStatus(
          Boolean(user.superhost),
          typeof user.responseRate === "number" ? user.responseRate : null,
          Boolean(user.verified),
        ),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getVerificationQueue(limit = 200): Promise<AdminVerificationQueueRow[]> {
    const users = await this.getAdminUsers({ limit, page: 1 });
    return this.buildVerificationRows(users);
  }

  async updateAdminUser(
    userId: string,
    input: {
      role?: "guest" | "host" | "admin";
      verified?: boolean;
      superhost?: boolean;
    },
  ): Promise<AdminUserManagementRow> {
    const user = await this.gateway.request<AdminUsersConnectionResponse["data"][number]>(
      "adminUpdateUser",
      `mutation AdminUpdateUser($userId: ID!, $input: AdminUpdateUserInput!) {
        adminUpdateUser(userId: $userId, input: $input) {
          id
          name
          email
          avatar
          role
          verified
          superhost
          responseRate
          listingsCount
          promotedListingsCount
          lastActivityAt
          health
          createdAt
          updatedAt
        }
      }`,
      { userId, input },
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      verified: Boolean(user.verified),
      listingsCount: user.listingsCount,
      promotedListingsCount: user.promotedListingsCount,
      superhost: Boolean(user.superhost),
      responseRate: typeof user.responseRate === "number" ? user.responseRate : null,
      lastActivityAt: user.lastActivityAt,
      health:
        user.health ??
        this.getHealthStatus(
          Boolean(user.superhost),
          typeof user.responseRate === "number" ? user.responseRate : null,
          Boolean(user.verified),
        ),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private buildUserRows(hotels: AdminHotelInventoryRow[]) {
    const owners = new Map<string, AdminUserManagementRow>();

    hotels.forEach((hotel) => {
      const current = owners.get(hotel.ownerId);
      const lastActivityAt =
        current && new Date(current.lastActivityAt) > new Date(hotel.updatedAt)
          ? current.lastActivityAt
          : hotel.updatedAt;

      if (!current) {
        owners.set(hotel.ownerId, {
          id: hotel.ownerId,
          name: hotel.ownerName,
          avatar: hotel.ownerAvatar,
          role: "host",
          verified: Boolean(hotel.superhost),
          listingsCount: 1,
          promotedListingsCount: hotel.isPromoted ? 1 : 0,
          superhost: hotel.superhost,
          responseRate: hotel.responseRate,
          lastActivityAt,
          health: this.getHealthStatus(
            hotel.superhost,
            hotel.responseRate,
            Boolean(hotel.superhost),
          ),
        });
        return;
      }

      owners.set(hotel.ownerId, {
        ...current,
        listingsCount: current.listingsCount + 1,
        promotedListingsCount:
          current.promotedListingsCount + (hotel.isPromoted ? 1 : 0),
        superhost: current.superhost || hotel.superhost,
        verified: current.verified || hotel.superhost,
        responseRate:
          current.responseRate === null
            ? hotel.responseRate
            : hotel.responseRate === null
              ? current.responseRate
              : Math.round((current.responseRate + hotel.responseRate) / 2),
        lastActivityAt,
        health: this.getHealthStatus(
          current.superhost || hotel.superhost,
          current.responseRate === null
            ? hotel.responseRate
            : hotel.responseRate === null
              ? current.responseRate
              : Math.round((current.responseRate + hotel.responseRate) / 2),
          current.verified || hotel.superhost,
        ),
      });
    });

    return [...owners.values()].sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }

  private buildVerificationRows(users: AdminUserManagementRow[]) {
    const rows: AdminVerificationQueueRow[] = users
      .filter((user) => user.role === "host")
      .map((user) => {
      if (user.superhost || user.verified) {
        return {
          id: user.id,
          hostName: user.name,
          listingsCount: user.listingsCount,
          responseRate: user.responseRate,
          superhost: user.superhost,
          status: "verified",
          reason: "Superhost profile with consistent trust signals",
          lastActivityAt: user.lastActivityAt,
        };
      }

      if (typeof user.responseRate === "number" && user.responseRate >= 75) {
        return {
          id: user.id,
          hostName: user.name,
          listingsCount: user.listingsCount,
          responseRate: user.responseRate,
          superhost: user.superhost,
          status: "in_review",
          reason: "Healthy response behavior, pending manual trust review",
          lastActivityAt: user.lastActivityAt,
        };
      }

      return {
        id: user.id,
        hostName: user.name,
        listingsCount: user.listingsCount,
        responseRate: user.responseRate,
        superhost: user.superhost,
        status: "pending",
        reason: "Needs additional verification and trust monitoring",
        lastActivityAt: user.lastActivityAt,
      };
      });

    return rows.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }

  private getHealthStatus(
    superhost: boolean,
    responseRate: number | null,
    verified: boolean,
  ): AdminUserManagementRow["health"] {
    if (superhost || (verified && typeof responseRate === "number" && responseRate >= 80)) {
      return "healthy";
    }
    if (verified || (typeof responseRate === "number" && responseRate >= 75)) {
      return "watch";
    }
    return "needs_attention";
  }
}

export class SupportAdminService extends AdminServiceBase {
  async getRoutingConsole(days = 7): Promise<AdminSupportRoutingConsole> {
    return this.gateway.request<AdminSupportRoutingConsole>(
      "supportRoutingConsole",
      `query SupportRoutingConsole($days: Int) {
        supportRoutingConsole(days: $days) {
          generatedAt
          lookbackDays
          queue {
            urgentSupportTickets {
              id
              subject
              status
              createdAt
            }
            activeIncidents {
              id
              description
              status
              createdAt
            }
          }
          routingSuggestions {
            trustAndSafetyPod
            frontlineSupport
            externalEscalationRequired
          }
        }
      }`,
      { days },
    );
  }

  async getOpsDashboard(days = 30): Promise<AdminSupportOpsDashboard> {
    return this.gateway.request<AdminSupportOpsDashboard>(
      "supportOpsDashboard",
      `query SupportOpsDashboard($days: Int) {
        supportOpsDashboard(days: $days) {
          generatedAt
          lookbackDays
          support {
            total
            resolved
            slaResolutionRate
          }
          safety {
            totalIncidents
            resolved
            resolvedWithin24h
            slaResolutionRate
          }
        }
      }`,
      { days },
    );
  }

  async getAirCoverBoard(): Promise<AdminAirCoverBoard> {
    return this.gateway.request<AdminAirCoverBoard>(
      "airCoverBoard",
      `query AirCoverBoard {
        airCoverBoard {
          generatedAt
          incidents {
            id
            bookingId
            reportedByUserId
            description
            status
            createdAt
          }
          emergencyTickets {
            id
            userId
            subject
            priority
            status
            createdAt
          }
          chargebackCases {
            id
            userId
            bookingId
            amount
            status
            reason
            createdAt
          }
        }
      }`,
    );
  }

  async getIncidents(): Promise<AdminIncident[]> {
    return this.gateway.request<AdminIncident[]>(
      "incidents",
      `query Incidents {
        incidents {
          id
          bookingId
          reportedByUserId
          description
          status
          createdAt
        }
      }`,
    );
  }

  async getOffPlatformFeeCases(): Promise<AdminOffPlatformFeeCase[]> {
    return this.gateway.request<AdminOffPlatformFeeCase[]>(
      "offPlatformFeeCases",
      `query OffPlatformFeeCases {
        offPlatformFeeCases {
          id
          bookingId
          reporterUserId
          description
          status
          createdAt
        }
      }`,
    );
  }

  async escalateSupportTicket(input: {
    ticketId: string;
    stage:
      | "pending_contact"
      | "active_response"
      | "local_authority_notified"
      | "follow_up"
      | "closed";
    notes?: string;
  }) {
    return this.gateway.request<{ id: string; status?: string }>(
      "supportEscalate",
      `mutation SupportEscalate($ticketId: ID!, $input: SupportEscalationInput!) {
        supportEscalate(ticketId: $ticketId, input: $input) {
          id
          status
        }
      }`,
      {
        ticketId: input.ticketId,
        input: {
          stage: input.stage,
          notes: input.notes,
        },
      },
    );
  }

  async updateIncidentStatus(input: {
    incidentId: string;
    status: "open" | "investigating" | "resolved" | "closed";
    resolution?: string;
  }) {
    return this.gateway.request<{ id: string; status?: string }>(
      "updateIncidentStatus",
      `mutation UpdateIncidentStatus($incidentId: ID!, $input: IncidentStatusInput!) {
        updateIncidentStatus(incidentId: $incidentId, input: $input) {
          id
          status
        }
      }`,
      {
        incidentId: input.incidentId,
        input: {
          status: input.status,
          resolution: input.resolution,
        },
      },
    );
  }

  async resolveIncident(input: { incidentId: string; resolution: string }) {
    return this.gateway.request<{ id: string; status?: string }>(
      "resolveIncident",
      `mutation ResolveIncident($incidentId: ID!, $input: IncidentResolveInput!) {
        resolveIncident(incidentId: $incidentId, input: $input) {
          id
          status
        }
      }`,
      {
        incidentId: input.incidentId,
        input: {
          resolution: input.resolution,
        },
      },
    );
  }
}

export class BookingAdminService extends SupportAdminService {
  async getBookingCaseRows(): Promise<AdminBookingCaseRow[]> {
    const [incidents, board, feeCases] = await Promise.all([
      this.getIncidents(),
      this.getAirCoverBoard(),
      this.getOffPlatformFeeCases(),
    ]);

    const incidentRows: AdminBookingCaseRow[] = incidents.map((incident) => ({
      id: `incident-${incident.id}`,
      caseType: "incident",
      bookingId: incident.bookingId,
      userId: incident.reportedByUserId,
      title: incident.description || "Incident reported",
      status: incident.status || "open",
      createdAt: incident.createdAt || new Date().toISOString(),
    }));

    const chargebackRows: AdminBookingCaseRow[] =
      board.chargebackCases.map((chargeback) => ({
        id: `chargeback-${chargeback.id}`,
        caseType: "chargeback",
        bookingId: chargeback.bookingId,
        userId: chargeback.userId,
        title: chargeback.reason || "Chargeback case",
        status: chargeback.status || "reviewing",
        amount: chargeback.amount,
        createdAt: chargeback.createdAt || new Date().toISOString(),
      }));

    const offPlatformRows: AdminBookingCaseRow[] = feeCases.map((feeCase) => ({
      id: `off-platform-${feeCase.id}`,
      caseType: "off_platform_fee",
      bookingId: feeCase.bookingId,
      userId: feeCase.reporterUserId,
      title: feeCase.description || "Off-platform payment case",
      status: feeCase.status || "open",
      createdAt: feeCase.createdAt || new Date().toISOString(),
    }));

    return [...incidentRows, ...chargebackRows, ...offPlatformRows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

export class FinanceAdminService extends BookingAdminService {
  async getPaymentQueueSummary(): Promise<AdminPaymentQueueSummary> {
    return this.gateway.request<AdminPaymentQueueSummary>(
      "paymentQueueSummary",
      `query PaymentQueueSummary {
        paymentQueueSummary {
          total
          pending
          processing
          completed
          failed
          refunded
          queued
          staleProcessing
        }
      }`,
    );
  }

  async getFxRates(): Promise<AdminFxRate[]> {
    return this.gateway.request<AdminFxRate[]>(
      "fxRates",
      `query FxRates {
        fxRates {
          id
          baseCurrency
          quoteCurrency
          rate
          provider
          effectiveAt
          createdAt
          updatedAt
        }
      }`,
    );
  }

  async upsertFxRate(input: {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    provider?: string;
  }): Promise<AdminFxRate> {
    return this.gateway.request<AdminFxRate>(
      "upsertFxRate",
      `mutation UpsertFxRate($input: FxRateInput!) {
        upsertFxRate(input: $input) {
          id
          baseCurrency
          quoteCurrency
          rate
          provider
          effectiveAt
          createdAt
          updatedAt
        }
      }`,
      { input },
    );
  }

  async reprocessStalePayments(input: {
    olderThanMinutes?: number;
    limit?: number;
    dryRun?: boolean;
  }): Promise<AdminReprocessResult> {
    return this.gateway.request<AdminReprocessResult>(
      "reprocessStalePayments",
      `mutation ReprocessStalePayments($input: ReprocessStalePaymentsInput) {
        reprocessStalePayments(input: $input) {
          dryRun
          olderThanMinutes
          scanned
          processedCount
          skippedCount
          processedPaymentIds
          skippedPaymentIds
          candidates {
            paymentId
            bookingId
            updatedAt
          }
        }
      }`,
      { input },
    );
  }
}

export const inventoryAdminService = new InventoryAdminService(
  adminGraphqlGateway,
);
export const supportAdminService = new SupportAdminService(adminGraphqlGateway);
export const bookingAdminService = new BookingAdminService(adminGraphqlGateway);
export const financeAdminService = new FinanceAdminService(adminGraphqlGateway);

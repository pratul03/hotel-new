export interface HostCancellationPolicy {
  id: string;
  hotelId: string;
  policyType: "flexible" | "moderate" | "strict";
  freeCancellationHours: number;
  partialRefundPercent: number;
  noShowPenaltyPercent: number;
}

export interface QuickReplyTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessage {
  id: string;
  receiverUserId: string;
  bookingId?: string;
  content: string;
  sendAt: string;
  sentAt?: string;
  status: string;
  receiver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HostAnalytics {
  rangeDays: number;
  totals: {
    bookings: number;
    confirmed: number;
    checkedOut: number;
    cancelled: number;
    conversionRate: number;
    cancellationRate: number;
    revenue: number;
    avgLeadTimeDays: number;
    avgRating: number;
    reviewsCount: number;
    occupancyRate: number;
  };
}

export interface HotelListingQuality {
  id: string;
  hotelId: string;
  coverImageUrl?: string;
  guidebook?: string;
  houseManual?: string;
  checkInSteps?: string;
  completenessScore: number;
}

export interface CoHostAssignment {
  id: string;
  hotelId: string;
  cohostUserId: string;
  permissions: string;
  revenueSplitPercent: number;
  cohost?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HotelComplianceChecklist {
  id: string;
  hotelId: string;
  jurisdictionCode: string;
  checklistItems: string;
  status: "incomplete" | "in_review" | "completed";
}

export interface HostClaim {
  id: string;
  hotelId: string;
  bookingId: string;
  title: string;
  description: string;
  amountClaimed: number;
  evidenceUrls: string;
  status: string;
  createdAt: string;
}

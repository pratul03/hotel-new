export interface Hotel {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  publicRules: string[];
  checkInTime: string;
  checkOutTime: string;
  instantBooking: boolean;
  isPromoted?: boolean;
  promotedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelOwner {
  id: string;
  name: string;
  avatar?: string;
  superhost: boolean;
  responseRate?: number;
}

export interface HotelReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string };
}

export interface HotelDetail extends Hotel {
  rooms: Room[];
  reviews: HotelReview[];
  owner?: HotelOwner;
  cancellationPolicy?: {
    policyType: string;
    freeCancellationHours: number;
    partialRefundPercent: number;
    noShowPenaltyPercent: number;
  };
}

export interface Room {
  id: string;
  hotelId: string;
  roomType: string;
  maxGuests: number;
  basePrice: number;
  amenities: string[] | string;
  images: string[] | string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HotelCalendarRule {
  id: string;
  hotelId: string;
  minStayNights: number;
  maxStayNights: number;
  advanceNoticeHours: number;
  prepTimeHours: number;
  allowSameDayCheckIn: boolean;
  checkInStartTime?: string;
  checkInEndTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelIcalSource {
  id: string;
  hotelId: string;
  name: string;
  url: string;
  enabled: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelIcalImportResult {
  eventsParsed: number;
  blockedDatesCreated: number;
}

export interface HotelPricingRule {
  id: string;
  hotelId: string;
  weekdayMultiplier: number;
  weekendMultiplier: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  earlyBirdDiscountPercent: number;
  lastMinuteDiscountPercent: number;
  cleaningFee: number;
  createdAt: string;
  updatedAt: string;
}

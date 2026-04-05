export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  childCount?: number;
  childAges?: number[];
  amount: number;
  status: BookingStatus;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetail extends Booking {
  room: {
    id: string;
    roomType: string;
    maxGuests: number;
    basePrice: number;
    images: string[];
    hotel: {
      id: string;
      name: string;
      location: string;
    };
  };
  priceBreakdown?: {
    basePrice: number;
    nights: number;
    subtotal: number;
    taxAmount: number;
    serviceFee: number;
    total: number;
  };
  history?: Array<{
    id: string;
    status: string;
    changedAt: string;
    updatedBy: string;
    notes?: string;
  }>;
}

export interface CancellationPreview {
  bookingId: string;
  policyType: string;
  hoursUntilCheckIn: number;
  refundablePercent: number;
  totalPaid: number;
  refundableAmount: number;
  nonRefundableAmount: number;
  canCancel: boolean;
}

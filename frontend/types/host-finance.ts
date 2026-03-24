export interface MonthlyGrossItem {
  month: string;
  gross: number;
}

export interface HostEarningsOverview {
  totalGross: number;
  totalServiceFee: number;
  totalTax: number;
  totalNet: number;
  pendingPayoutAmount: number;
  paidBookingsCount: number;
  monthlyGross: MonthlyGrossItem[];
}

export interface HostTransaction {
  bookingId: string;
  createdAt: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
  grossAmount: number;
  paymentStatus: string;
  serviceFee: number;
  tax: number;
  netAmount: number;
  guest: {
    id: string;
    name: string;
    email: string;
  };
  hotel: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    roomType: string;
  };
}

export interface HostPayoutAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumberLast4: string;
  ifscCode: string;
  upiId?: string;
  payoutMethod: "bank_transfer" | "upi";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostPayout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "requested" | "processing" | "paid" | "failed";
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  referenceId?: string;
  requestedAt: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostPayoutHistoryResponse {
  availableForPayout: number;
  payouts: HostPayout[];
}

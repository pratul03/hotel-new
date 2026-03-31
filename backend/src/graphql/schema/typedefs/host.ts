export const hostTypeDefs = `
  type HostProfile {
    id: ID!
    userId: ID
    companyName: String
    website: String
    businessType: String
    description: String
    createdAt: String
    updatedAt: String
    user: UserLite
  }

  type HostMonthlyGross {
    month: String!
    gross: Float!
  }

  type HostEarningsOverview {
    totalGross: Float!
    totalServiceFee: Float!
    totalTax: Float!
    totalNet: Float!
    pendingPayoutAmount: Float!
    paidBookingsCount: Int!
    monthlyGross: [HostMonthlyGross!]!
  }

  type HostFinanceGuest {
    id: ID
    name: String
    email: String
  }

  type HostFinanceHotel {
    id: ID
    name: String
  }

  type HostFinanceRoom {
    id: ID
    roomType: String
  }

  type HostTransaction {
    bookingId: ID!
    createdAt: String
    checkIn: String
    checkOut: String
    bookingStatus: String
    grossAmount: Float
    paymentStatus: String
    serviceFee: Float
    tax: Float
    netAmount: Float
    guest: HostFinanceGuest
    hotel: HostFinanceHotel
    room: HostFinanceRoom
  }

  type HostPayoutAccount {
    id: ID!
    userId: ID
    accountHolderName: String
    bankName: String
    accountNumberLast4: String
    ifscCode: String
    payoutMethod: String
    upiId: String
    createdAt: String
    updatedAt: String
  }

  type HostPayout {
    id: ID!
    userId: ID
    amount: Float
    status: String
    notes: String
    requestedAt: String
    createdAt: String
    updatedAt: String
  }

  type HostPayoutHistory {
    availableForPayout: Float!
    payouts: [HostPayout!]!
  }`;

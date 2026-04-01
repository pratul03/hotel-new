export const coreTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    role: String!
    verified: Boolean
    superhost: Boolean
    responseRate: Float
    createdAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type HotelOwner {
    id: ID!
    name: String
    avatar: String
    superhost: Boolean
    responseRate: Float
  }

  type HotelRoomSummary {
    id: ID!
    hotelId: ID
    roomType: String
    capacity: Int
    maxGuests: Int
    basePrice: Float
    isAvailable: Boolean
    amenities: [String!]!
    images: [String!]!
    createdAt: String
    updatedAt: String
  }

  type Hotel {
    id: ID!
    ownerId: String
    name: String!
    description: String
    location: String!
    amenities: [String!]!
    publicRules: [String!]!
    checkInTime: String
    checkOutTime: String
    instantBooking: Boolean
    isPromoted: Boolean
    promotedUntil: String
    createdAt: String
    updatedAt: String
    owner: HotelOwner
    rooms: [HotelRoomSummary!]
  }

  type HotelSummary {
    id: ID
    name: String
    location: String
  }

  type Room {
    id: ID!
    hotelId: ID
    roomType: String
    capacity: Int
    maxGuests: Int
    basePrice: Float
    isAvailable: Boolean
    amenities: [String!]!
    images: [String!]!
    createdAt: String
    updatedAt: String
    hotel: HotelSummary
  }

  type Payment {
    id: ID!
    bookingId: ID
    razorpayOrderId: String
    razorpayPaymentId: String
    amount: Float
    status: String
    createdAt: String
    updatedAt: String
  }

  type BookingHistory {
    id: ID
    bookingId: ID
    status: String
    updatedBy: String
    notes: String
    changedAt: String
  }

  type Booking {
    id: ID!
    userId: ID
    roomId: ID
    checkIn: String
    checkOut: String
    guestCount: Int
    notes: String
    amount: Float
    status: String
    expiresAt: String
    createdAt: String
    updatedAt: String
    room: Room
    payment: Payment
    history: [BookingHistory!]
  }

  type BookingPricingBreakdown {
    subtotal: Float
    serviceFee: Float
    tax: Float
    total: Float
  }

  type CancellationPolicyPreview {
    policyType: String
    freeCancellationHours: Int
    partialRefundPercent: Float
  }

  type BookingPricePreview {
    roomId: ID
    hotelId: ID
    nights: Int
    guestCount: Int
    nightlyBasePrice: Float
    pricing: BookingPricingBreakdown
    cancellationPolicy: CancellationPolicyPreview
  }

  type ReservationRiskFactors {
    unverifiedUser: Int
    highCancellationHistory: Int
    veryShortLeadTime: Int
    highGuestToCapacityRatio: Int
    highOrderValue: Int
    trustedAccountAge: Int
  }

  type ReservationRisk {
    userId: ID
    roomId: ID
    riskScore: Int
    riskLevel: String
    recommendation: String
    factors: ReservationRiskFactors
    pricing: BookingPricingBreakdown
  }

  type RebookingOption {
    roomId: ID
    hotelId: ID
    hotelName: String
    location: String
    roomType: String
    maxGuests: Int
    basePrice: Float
    estimatedPriceDifference: Float
  }

  type RefundFallback {
    eligible: Boolean
    estimatedRefundAmount: Float
  }

  type RebookingOptionsResult {
    bookingId: ID
    reason: String
    comparableOptions: [RebookingOption!]!
    fallbackRefund: RefundFallback
  }

  type RoomAvailability {
    isAvailable: Boolean!
    reason: String
  }

  type RoomPricing {
    basePrice: Float
    nights: Int
    cleaningFee: Float
    subtotal: Float
    serviceCharge: Float
    taxes: Float
    total: Float
    currency: String
  }

  type PaymentOrder {
    id: String
    amount: Float
    currency: String
    queued: Boolean
  }

  type PaymentOrderResult {
    idempotent: Boolean
    order: PaymentOrder
    payment: Payment
  }

  type PaymentQueueSummary {
    total: Int
    pending: Int
    processing: Int
    completed: Int
    failed: Int
    refunded: Int
    queued: Int
    staleProcessing: Int
  }

  type FxRate {
    id: ID
    baseCurrency: String
    quoteCurrency: String
    rate: Float
    provider: String
    effectiveAt: String
    createdAt: String
    updatedAt: String
  }

  type ReprocessCandidate {
    paymentId: ID
    bookingId: ID
    updatedAt: String
  }

  type ReprocessStalePaymentsResult {
    dryRun: Boolean
    olderThanMinutes: Int
    scanned: Int
    processedCount: Int
    skippedCount: Int
    processedPaymentIds: [ID!]
    skippedPaymentIds: [ID!]
    candidates: [ReprocessCandidate!]
  }

  type UserLite {
    id: ID
    name: String
    avatar: String
  }

  type Message {
    id: ID
    senderId: ID
    receiverId: ID
    bookingId: ID
    content: String
    attachmentUrl: String
    attachmentType: String
    hasAttachment: Boolean
    messageType: String
    read: Boolean
    createdAt: String
    updatedAt: String
    sender: UserLite
    receiver: UserLite
    escalatedTicketId: ID
  }

  type Conversation {
    userId: ID
    userName: String
    userAvatar: String
    lastMessage: String
    hasAttachment: Boolean
    attachmentType: String
    lastMessageAt: String
    unreadCount: Int
    bookingId: ID
  }

  type UnreadMessagesCount {
    unreadCount: Int!
  }

  type Notification {
    id: ID
    userId: ID
    type: String
    content: String
    link: String
    read: Boolean
    createdAt: String
    updatedAt: String
  }

  type UnreadCount {
    count: Int!
  }

  type NotificationPreferences {
    inApp: Boolean
    email: Boolean
    push: Boolean
    booking: Boolean
    message: Boolean
    payment: Boolean
    marketing: Boolean
  }

  type DeleteResult {
    deleted: Boolean!
    message: String
  }

  type HotelPromotionState {
    id: ID!
    name: String
    isPromoted: Boolean
    promotedUntil: String
  }

  type BlockedDate {
    id: ID!
    hotelId: ID
    roomId: ID
    startDate: String
    endDate: String
    reason: String
    createdAt: String
    updatedAt: String
  }

  type HotelCalendarRule {
    id: ID!
    hotelId: ID
    minStayNights: Int
    maxStayNights: Int
    advanceNoticeHours: Int
    prepTimeHours: Int
    allowSameDayCheckIn: Boolean
    checkInStartTime: String
    checkInEndTime: String
    createdAt: String
    updatedAt: String
  }

  type HotelIcalSource {
    id: ID!
    hotelId: ID
    name: String
    url: String
    enabled: Boolean
    lastSyncedAt: String
    createdAt: String
    updatedAt: String
  }

  type HotelIcalImportResult {
    eventsParsed: Int!
    blockedDatesCreated: Int!
  }

  type HotelPricingRule {
    id: ID!
    hotelId: ID
    weekdayMultiplier: Float
    weekendMultiplier: Float
    weeklyDiscountPercent: Float
    monthlyDiscountPercent: Float
    earlyBirdDiscountPercent: Float
    lastMinuteDiscountPercent: Float
    cleaningFee: Float
    createdAt: String
    updatedAt: String
  }

  type CancellationPreview {
    bookingId: ID!
    policyType: String
    hoursUntilCheckIn: Int!
    refundablePercent: Float!
    totalPaid: Float!
    refundableAmount: Float!
    nonRefundableAmount: Float!
    canCancel: Boolean!
  }

  type PresignedUrlResult {
    presignedUrl: String
    bucket: String
    objectKey: String
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    role: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateHotelInput {
    name: String!
    description: String
    location: String!
    amenities: [String!]
    publicRules: [String!]
    checkInTime: String
    checkOutTime: String
    instantBooking: Boolean
  }

  input UpdateHotelInput {
    name: String
    description: String
    location: String
    amenities: [String!]
    publicRules: [String!]
    checkInTime: String
    checkOutTime: String
    instantBooking: Boolean
  }

  input SearchHotelsInput {
    latitude: Float
    longitude: Float
    radiusKm: Float
    checkIn: String
    checkOut: String
    guests: Int
    minPrice: Float
    maxPrice: Float
    instantBooking: Boolean
    minRating: Float
    accessibility: String
    north: Float
    south: Float
    east: Float
    west: Float
    sortBy: String
    page: Int
    limit: Int
  }

  input CreateBookingInput {
    roomId: ID!
    checkIn: String!
    checkOut: String!
    guestCount: Int!
    notes: String
  }

  input UpdateBookingInput {
    guestCount: Int
    checkIn: String
    checkOut: String
    notes: String
  }

  input RoomDateRangeInput {
    checkIn: String!
    checkOut: String!
  }

  input CreateRoomInput {
    roomType: String!
    capacity: Int!
    maxGuests: Int!
    basePrice: Float!
    amenities: [String!]
  }

  input UpdateRoomInput {
    roomType: String
    capacity: Int
    maxGuests: Int
    basePrice: Float
    amenities: [String!]
  }

  input VerifyPaymentInput {
    bookingId: ID!
    razorpayOrderId: String!
    razorpayPaymentId: String!
    razorpaySignature: String!
  }

  input BlockDatesInput {
    startDate: String!
    endDate: String!
    reason: String!
  }

  input HotelCalendarRulesInput {
    minStayNights: Int!
    maxStayNights: Int!
    advanceNoticeHours: Int!
    prepTimeHours: Int!
    allowSameDayCheckIn: Boolean!
    checkInStartTime: String
    checkInEndTime: String
  }

  input HotelIcalSourceInput {
    name: String!
    url: String!
    enabled: Boolean
  }

  input HotelIcalImportInput {
    icsContent: String
    sourceUrl: String
    reason: String
  }

  input HotelPricingRulesInput {
    weekdayMultiplier: Float!
    weekendMultiplier: Float!
    weeklyDiscountPercent: Float!
    monthlyDiscountPercent: Float!
    earlyBirdDiscountPercent: Float!
    lastMinuteDiscountPercent: Float!
    cleaningFee: Float!
  }

  input SendMessageInput {
    receiverUserId: ID
    receiverId: ID
    content: String!
    bookingId: ID
    attachmentUrl: String
    attachmentType: String
    escalateToSupport: Boolean
  }

  input NotificationPreferencesInput {
    inApp: Boolean
    email: Boolean
    push: Boolean
    booking: Boolean
    message: Boolean
    payment: Boolean
    marketing: Boolean
  }

  input ReprocessStalePaymentsInput {
    olderThanMinutes: Int
    limit: Int
    dryRun: Boolean
  }

  input FxRateInput {
    baseCurrency: String!
    quoteCurrency: String!
    rate: Float!
    provider: String
  }

  input CreatePaymentOrderInput {
    bookingId: ID!
  }

  type SearchHotelsResponse {
    data: [Hotel!]!
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }`;

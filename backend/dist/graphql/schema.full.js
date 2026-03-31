"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphQLResolvers = exports.graphQLTypeDefs = void 0;
const auth_schema_1 = require("../modules/auth/schemas/auth.schema");
const auth_service_1 = require("../modules/auth/services/auth.service");
const booking_schema_1 = require("../modules/booking/schemas/booking.schema");
const booking_service_1 = require("../modules/booking/services/booking.service");
const hotel_schema_1 = require("../modules/hotel/schemas/hotel.schema");
const hotel_service_1 = require("../modules/hotel/services/hotel.service");
const messages_service_1 = require("../modules/messages/services/messages.service");
const messages_schema_1 = require("../modules/messages/schemas/messages.schema");
const notifications_service_1 = require("../modules/notifications/services/notifications.service");
const notifications_schema_1 = require("../modules/notifications/schemas/notifications.schema");
const payments_schema_1 = require("../modules/payments/schemas/payments.schema");
const payment_service_1 = require("../modules/payments/services/payment.service");
const room_service_1 = require("../modules/room/services/room.service");
const room_schema_1 = require("../modules/room/schemas/room.schema");
const users_service_1 = require("../modules/users/services/users.service");
const users_schema_1 = require("../modules/users/schemas/users.schema");
const wishlist_service_1 = require("../modules/wishlist/services/wishlist.service");
const wishlist_schema_1 = require("../modules/wishlist/schemas/wishlist.schema");
const support_service_1 = require("../modules/support/services/support.service");
const support_schema_1 = require("../modules/support/schemas/support.schema");
const reports_service_1 = require("../modules/reports/services/reports.service");
const reports_schema_1 = require("../modules/reports/schemas/reports.schema");
const host_profile_service_1 = require("../modules/host-profile/services/host-profile.service");
const host_profile_schema_1 = require("../modules/host-profile/schemas/host-profile.schema");
const host_finance_service_1 = require("../modules/host-finance/services/host-finance.service");
const host_finance_schema_1 = require("../modules/host-finance/schemas/host-finance.schema");
const host_tools_service_1 = require("../modules/host-tools/services/host-tools.service");
const host_tools_schema_1 = require("../modules/host-tools/schemas/host-tools.schema");
const promotions_service_1 = require("../modules/promotions/services/promotions.service");
const promotions_schema_1 = require("../modules/promotions/schemas/promotions.schema");
const search_history_service_1 = require("../modules/search-history/services/search-history.service");
const search_history_schema_1 = require("../modules/search-history/schemas/search-history.schema");
const invoicing_service_1 = require("../modules/invoices/services/invoicing.service");
const invoices_schema_1 = require("../modules/invoices/schemas/invoices.schema");
const review_service_1 = require("../modules/review/services/review.service");
const review_schema_1 = require("../modules/review/schemas/review.schema");
const database_1 = require("../config/database");
const context_1 = require("./context");
const toArray = (value) => {
    if (Array.isArray(value)) {
        return value.map(String);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
const toIsoString = (value) => {
    if (!value)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const normalizeHotel = (hotel) => ({
    ...hotel,
    amenities: toArray(hotel.amenities),
    createdAt: toIsoString(hotel.createdAt),
    updatedAt: toIsoString(hotel.updatedAt),
    promotedUntil: toIsoString(hotel.promotedUntil),
});
const normalizeRoom = (room) => ({
    ...room,
    amenities: toArray(room.amenities),
    images: toArray(room.images),
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.updatedAt),
});
const toStringRecord = (value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [
            String(k),
            String(v ?? ""),
        ]));
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [String(k), String(v ?? "")]));
            }
        }
        catch {
            return {};
        }
    }
    return {};
};
const toUnknownArray = (value) => {
    if (Array.isArray(value))
        return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
const toMetadataEntries = (value) => Object.entries(toStringRecord(value)).map(([key, entryValue]) => ({
    key,
    value: entryValue,
}));
const toDate = (value) => new Date(value);
exports.graphQLTypeDefs = `#graphql
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
    roomType: String
    capacity: Int
    maxGuests: Int
    basePrice: Float
    amenities: [String!]!
    images: [String!]!
  }

  type Hotel {
    id: ID!
    ownerId: String
    name: String!
    description: String
    location: String!
    amenities: [String!]!
    publicRules: String
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
    publicRules: String
    checkInTime: String
    checkOutTime: String
    instantBooking: Boolean
  }

  input SearchHotelsInput {
    latitude: Float!
    longitude: Float!
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
  }

  type SessionRecord {
    sessionId: String!
    userId: String!
    createdAt: String!
    lastSeenAt: String!
  }

  type SimpleResult {
    success: Boolean!
    message: String
  }

  type TokenResult {
    token: String!
  }

  type ForgotPasswordResult {
    message: String!
    resetToken: String
    resetUrl: String
    expiresIn: String
  }

  type MfaSetupResult {
    secret: String!
    otpauthUrl: String!
    expiresInSeconds: Int!
  }

  type MfaVerifyResult {
    enabled: Boolean!
  }

  type UserDocument {
    id: ID!
    userId: ID
    documentType: String
    docUrl: String
    status: String
    createdAt: String
  }

  type HostVerification {
    id: ID!
    userId: ID
    kycStatus: String
    taxId: String
    approvedAt: String
    createdAt: String
    updatedAt: String
    user: UserLite
  }

  type LoyaltyNextTierTarget {
    tier: String!
    staysRequired: Int!
    spendRequired: Float!
  }

  type PersonalizationSignals {
    searches: Int!
  }

  type LoyaltySummary {
    tier: String!
    benefits: [String!]!
    rewardPoints: Int!
    totalSpent: Float!
    completedStays: Int!
    nextTierTarget: LoyaltyNextTierTarget
    referralCode: String!
    personalizationSignals: PersonalizationSignals!
  }

  type IdentityChecks {
    governmentId: Boolean!
    addressProof: Boolean!
    selfieMatch: Boolean!
  }

  type IdentityDocument {
    id: ID!
    documentType: String!
    status: String
    createdAt: String
  }

  type IdentityVerification {
    userId: ID!
    stage: String!
    checks: IdentityChecks!
    requiredActions: [String!]!
    documents: [IdentityDocument!]!
  }

  type WishlistItem {
    id: ID!
    userId: ID
    roomId: ID
    listName: String
    addedAt: String
    room: Room
  }

  type WishlistCollection {
    name: String!
    count: Int!
  }

  type WishlistShareLink {
    shareCode: String!
    shareUrl: String!
    listName: String!
  }

  type WishlistInvitee {
    id: ID
    email: String
    name: String
  }

  type WishlistInviteCreateResult {
    inviteId: ID!
    shareCode: String!
    invitee: WishlistInvitee
    permission: String!
  }

  type WishlistInvite {
    id: ID!
    read: Boolean!
    createdAt: String
    ownerId: ID
    listName: String
    shareCode: String
    permission: String!
  }

  type WishlistAcceptResult {
    accepted: Boolean!
    importedItems: Int!
    listName: String!
    permission: String!
  }

  type SharedWishlist {
    owner: UserLite
    listName: String!
    items: [WishlistItem!]!
  }

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
  }

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
  }

  type Promotion {
    code: String!
    description: String!
    minSubtotal: Float!
  }

  type PromotionValidation {
    code: String!
    description: String!
    discountAmount: Float!
    subtotal: Float!
    finalSubtotal: Float!
  }

  type SearchHistoryItem {
    id: ID!
    userId: ID
    queryLocation: String
    checkIn: String
    checkOut: String
    guests: Int
    createdAt: String
  }

  type CancellationPolicy {
    id: ID!
    hotelId: ID
    policyType: String
    freeCancellationHours: Int
    partialRefundPercent: Int
    noShowPenaltyPercent: Int
    createdAt: String
    updatedAt: String
  }

  type QuickReplyTemplate {
    id: ID!
    userId: ID
    title: String
    content: String
    category: String
    createdAt: String
    updatedAt: String
  }

  type ScheduledMessage {
    id: ID!
    senderUserId: ID
    receiverUserId: ID
    bookingId: ID
    content: String
    sendAt: String
    status: String
    createdAt: String
    updatedAt: String
    receiver: UserLite
  }

  type HostAnalyticsTotals {
    bookings: Int!
    confirmed: Int!
    checkedOut: Int!
    cancelled: Int!
    conversionRate: Float!
    cancellationRate: Float!
    revenue: Float!
    avgLeadTimeDays: Float!
    avgRating: Float!
    reviewsCount: Int!
    occupancyRate: Float!
  }

  type HostAnalyticsDailySnapshot {
    date: String!
    bookings: Int!
    confirmed: Int!
    revenue: Float!
  }

  type HostAnalytics {
    rangeDays: Int!
    totals: HostAnalyticsTotals!
    dailySnapshots: [HostAnalyticsDailySnapshot!]!
  }

  type CoHostAssignment {
    id: ID!
    hotelId: ID
    hostUserId: ID
    cohostUserId: ID
    permissions: [String!]!
    revenueSplitPercent: Int
    createdAt: String
    updatedAt: String
    cohost: UserLite
  }

  type ComplianceChecklistItem {
    label: String!
    completed: Boolean!
  }

  type HotelComplianceChecklist {
    id: ID!
    hotelId: ID
    jurisdictionCode: String
    checklistItems: [ComplianceChecklistItem!]!
    status: String
    createdAt: String
    updatedAt: String
  }

  type HotelListingToolkit {
    id: ID!
    hotelId: ID
    coverImageUrl: String
    guidebook: String
    houseManual: String
    checkInSteps: String
    completenessScore: Int
    createdAt: String
    updatedAt: String
  }

  type HostClaimHotel {
    id: ID
    name: String
  }

  type HostClaimBooking {
    id: ID
    checkIn: String
    checkOut: String
  }

  type HostClaim {
    id: ID!
    hotelId: ID
    bookingId: ID
    hostUserId: ID
    title: String
    description: String
    amountClaimed: Float
    evidenceUrls: [String!]!
    status: String
    resolutionNote: String
    createdAt: String
    updatedAt: String
    hotel: HostClaimHotel
    booking: HostClaimBooking
  }

  type ComplianceTotals {
    complianceRecords: Int!
    claims: Int!
  }

  type ComplianceAuditRecords {
    checklists: [HotelComplianceChecklist!]!
    claims: [HostClaim!]!
  }

  type ComplianceAudit {
    generatedAt: String!
    lookbackDays: Int!
    totals: ComplianceTotals!
    records: ComplianceAuditRecords!
    csv: String!
  }

  type InvoiceLineItem {
    description: String!
    amount: Float!
  }

  type InvoiceMetadataEntry {
    key: String!
    value: String!
  }

  type InvoiceDocument {
    id: ID!
    userId: ID
    bookingId: ID
    paymentId: ID
    type: String
    status: String
    title: String
    documentNumber: String
    currency: String
    amount: Float
    fileUrl: String
    storageBucket: String
    storageKey: String
    issuedAt: String
    revokedAt: String
    createdAt: String
    updatedAt: String
    lineItems: [InvoiceLineItem!]!
    metadata: [InvoiceMetadataEntry!]!
    idempotent: Boolean
    fileName: String
  }

  type InvoiceAccessUrl {
    fileUrl: String
    signedUrl: String
    expiresInSeconds: Int
  }

  type InvoiceStorageAudit {
    dryRun: Boolean!
    repairMissing: Boolean!
    scanned: Int!
    missingStorageRefs: Int!
    missingObjects: Int!
    repaired: Int!
    failedRepairs: Int!
    missingStorageRefIds: [ID!]!
    missingObjectIds: [ID!]!
    repairedIds: [ID!]!
    failedRepairIds: [ID!]!
  }

  type Review {
    id: ID!
    senderId: ID
    receiverId: ID
    bookingId: ID
    hotelId: ID
    rating: Int
    comment: String
    categories: [InvoiceMetadataEntry!]!
    createdAt: String
    updatedAt: String
    sender: UserLite
    receiver: UserLite
  }

  input AuthProfileUpdateInput {
    name: String
    avatar: String
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input VerifyMfaInput {
    code: String!
  }

  input AddUserDocumentInput {
    documentType: String!
    docUrl: String!
  }

  input UserProfileUpdateInput {
    name: String
    avatar: String
  }

  input WishlistAddInput {
    roomId: ID!
    listName: String
  }

  input WishlistRemoveInput {
    roomId: ID!
    listName: String
  }

  input WishlistShareInput {
    listName: String!
  }

  input WishlistInviteInput {
    listName: String!
    email: String!
    permission: String
  }

  input WishlistAcceptInput {
    inviteId: ID!
  }

  input SupportTicketInput {
    subject: String!
    description: String!
    priority: String
  }

  input SupportReplyInput {
    reply: String!
  }

  input SupportEmergencyInput {
    description: String!
    bookingId: ID
    locationHint: String
  }

  input SupportEscalationInput {
    stage: String!
    notes: String
  }

  input IncidentCreateInput {
    bookingId: ID!
    description: String!
  }

  input IncidentStatusInput {
    status: String!
    resolution: String
  }

  input IncidentResolveInput {
    resolution: String!
  }

  input OffPlatformFeeInput {
    bookingId: ID!
    description: String!
    evidenceUrls: [String!]
  }

  input HostProfileInput {
    companyName: String!
    website: String
    businessType: String
    description: String
  }

  input HostProfileUpdateInput {
    companyName: String
    website: String
    businessType: String
    description: String
  }

  input HostPayoutAccountInput {
    accountHolderName: String!
    bankName: String!
    accountNumber: String!
    ifscCode: String!
    payoutMethod: String
    upiId: String
  }

  input HostPayoutRequestInput {
    amount: Float!
    notes: String
  }

  input CancellationPolicyInput {
    policyType: String!
    freeCancellationHours: Int!
    partialRefundPercent: Int!
    noShowPenaltyPercent: Int!
  }

  input QuickReplyInput {
    title: String!
    content: String!
    category: String
  }

  input ScheduledMessageInput {
    receiverUserId: ID!
    bookingId: ID
    content: String!
    sendAt: String!
  }

  input AddCoHostInput {
    cohostUserId: ID!
    permissions: [String!]
    revenueSplitPercent: Int
  }

  input ComplianceChecklistItemInput {
    label: String!
    completed: Boolean!
  }

  input ComplianceChecklistInput {
    jurisdictionCode: String!
    checklistItems: [ComplianceChecklistItemInput!]!
    status: String
  }

  input ListingQualityInput {
    coverImageUrl: String
    guidebook: String
    houseManual: String
    checkInSteps: String
  }

  input HostClaimInput {
    hotelId: ID!
    bookingId: ID!
    title: String!
    description: String!
    amountClaimed: Float
    evidenceUrls: [String!]
  }

  input AdjudicateClaimInput {
    status: String!
    resolutionNote: String
  }

  input PromotionValidateInput {
    code: String!
    subtotal: Float!
  }

  input SearchHistoryInput {
    queryLocation: String!
    checkIn: String
    checkOut: String
    guests: Int
  }

  input InvoiceLineItemInput {
    description: String!
    amount: Float!
  }

  input InvoiceCreateInput {
    type: String!
    title: String!
    bookingId: ID
    paymentId: ID
    amount: Float
    currency: String
    lineItems: [InvoiceLineItemInput!]
  }

  input InvoiceStorageAuditInput {
    limit: Int
    olderThanDays: Int
    repairMissing: Boolean
    dryRun: Boolean
  }

  input ReviewCreateInput {
    bookingId: ID!
    receiverId: ID!
    rating: Int!
    comment: String
    hotelId: ID
  }

  input ReviewUpdateInput {
    rating: Int
    comment: String
  }

  type Query {
    me: User!
    hotelById(id: ID!): Hotel!
    searchHotels(input: SearchHotelsInput!): SearchHotelsResponse!
    myBookings: [Booking!]!
    hostBookings: [Booking!]!
    bookingById(bookingId: ID!): Booking!
    bookingPricePreview(input: CreateBookingInput!): BookingPricePreview!
    reservationRisk(input: CreateBookingInput!): ReservationRisk!
    rebookingOptions(bookingId: ID!, reason: String!): RebookingOptionsResult!
    roomById(roomId: ID!): Room!
    roomAvailability(roomId: ID!, input: RoomDateRangeInput!): RoomAvailability!
    roomPricing(roomId: ID!, input: RoomDateRangeInput!): RoomPricing!
    paymentById(paymentId: ID!): Payment!
    paymentByBooking(bookingId: ID!): Payment!
    paymentQueueSummary: PaymentQueueSummary!
    fxRates: [FxRate!]!
    messageThread(otherUserId: ID!): [Message!]!
    conversations: [Conversation!]!
    unreadMessagesCount: UnreadMessagesCount!
    notifications: [Notification!]!
    unreadNotificationsCount: UnreadCount!
    notificationPreferences: NotificationPreferences!
    authSessions: [SessionRecord!]!
    userDocuments: [UserDocument!]!
    hostVerification: HostVerification!
    loyaltySummary: LoyaltySummary!
    identityVerification: IdentityVerification!
    wishlist(listName: String): [WishlistItem!]!
    wishlistCollections: [WishlistCollection!]!
    wishlistShared(shareCode: String!): SharedWishlist!
    wishlistInvites: [WishlistInvite!]!
    supportTickets: [SupportTicket!]!
    supportTicket(ticketId: ID!): SupportTicket!
    supportRoutingConsole(days: Int): SupportRoutingConsole!
    supportOpsDashboard(days: Int): SupportOpsDashboard!
    incidents(status: String, bookingId: ID): [IncidentReport!]!
    incidentById(incidentId: ID!): IncidentReport!
    airCoverBoard: AirCoverBoard!
    offPlatformFeeCases: [OffPlatformFeeCase!]!
    hostProfile: HostProfile!
    hostFinanceEarnings(months: Int): HostEarningsOverview!
    hostFinanceTransactions(limit: Int): [HostTransaction!]!
    hostPayoutAccount: HostPayoutAccount
    hostPayoutHistory(limit: Int): HostPayoutHistory!
    hostCancellationPolicy(hotelId: ID!): CancellationPolicy
    hostQuickReplies: [QuickReplyTemplate!]!
    hostScheduledMessages: [ScheduledMessage!]!
    hostAnalytics(days: Int): HostAnalytics!
    hostCoHosts(hotelId: ID!): [CoHostAssignment!]!
    hostComplianceChecklist(hotelId: ID!): HotelComplianceChecklist
    hostListingQuality(hotelId: ID!): HotelListingToolkit
    hostClaims: [HostClaim!]!
    hostComplianceAudit(days: Int): ComplianceAudit!
    promotions: [Promotion!]!
    searchHistory: [SearchHistoryItem!]!
    invoices(type: String, status: String): [InvoiceDocument!]!
    invoiceAccessUrl(invoiceId: ID!, expiresIn: Int): InvoiceAccessUrl!
    reviews(bookingId: ID): [Review!]!
    reviewById(reviewId: ID!): Review
    reviewByBooking(bookingId: ID!): Review
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createHotel(input: CreateHotelInput!): Hotel!
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(bookingId: ID!, input: UpdateBookingInput!): Booking!
    cancelBooking(bookingId: ID!, reason: String): Booking!
    confirmCheckIn(bookingId: ID!): Booking!
    confirmCheckOut(bookingId: ID!): Booking!
    hostAcceptBooking(bookingId: ID!): Booking!
    hostDeclineBooking(bookingId: ID!, reason: String): Booking!
    hostAlterBooking(bookingId: ID!, input: UpdateBookingInput!): Booking!
    hostMarkNoShow(bookingId: ID!, notes: String): Booking!
    createRoom(hotelId: ID!, input: CreateRoomInput!): Room!
    updateRoom(roomId: ID!, input: UpdateRoomInput!): Room!
    deleteRoom(roomId: ID!): DeleteResult!
    roomPresignedUrl(roomId: ID!, fileName: String!): PresignedUrlResult!
    deleteRoomImage(roomId: ID!, imageKey: String!): Room!
    createPaymentOrder(input: CreatePaymentOrderInput!): PaymentOrderResult!
    reprocessStalePayments(input: ReprocessStalePaymentsInput): ReprocessStalePaymentsResult!
    upsertFxRate(input: FxRateInput!): FxRate!
    sendMessage(input: SendMessageInput!): Message!
    markMessageRead(messageId: ID!): UnreadCount!
    markNotificationRead(notificationId: ID!): UnreadCount!
    markAllNotificationsRead: UnreadCount!
    updateNotificationPreferences(input: NotificationPreferencesInput!): NotificationPreferences!
    deleteNotification(notificationId: ID!): DeleteResult!
    logout: SimpleResult!
    updateMyProfile(input: AuthProfileUpdateInput!): User!
    verifyEmail: User!
    refreshToken: TokenResult!
    forgotPassword(email: String!): ForgotPasswordResult!
    resetPassword(input: ResetPasswordInput!): SimpleResult!
    revokeSession(sessionId: ID!): SimpleResult!
    revokeOtherSessions: SimpleResult!
    setupMfa: MfaSetupResult!
    verifyMfa(input: VerifyMfaInput!): MfaVerifyResult!
    addUserDocument(input: AddUserDocumentInput!): UserDocument!
    deleteUserDocument(docId: ID!): DeleteResult!
    updateUserProfile(input: UserProfileUpdateInput!): User!
    wishlistAdd(input: WishlistAddInput!): WishlistItem!
    wishlistRemove(input: WishlistRemoveInput!): DeleteResult!
    wishlistCreateShare(input: WishlistShareInput!): WishlistShareLink!
    wishlistInvite(input: WishlistInviteInput!): WishlistInviteCreateResult!
    wishlistAccept(input: WishlistAcceptInput!): WishlistAcceptResult!
    supportCreateTicket(input: SupportTicketInput!): SupportTicket!
    supportReply(ticketId: ID!, input: SupportReplyInput!): SupportTicket!
    supportEscalate(ticketId: ID!, input: SupportEscalationInput!): SupportTicket!
    supportCreateEmergency(input: SupportEmergencyInput!): EmergencyTicketResult!
    reportIncident(input: IncidentCreateInput!): IncidentReport!
    updateIncidentStatus(incidentId: ID!, input: IncidentStatusInput!): IncidentReport!
    resolveIncident(incidentId: ID!, input: IncidentResolveInput!): IncidentReport!
    createOffPlatformFeeCase(input: OffPlatformFeeInput!): OffPlatformFeeCase!
    createHostProfile(input: HostProfileInput!): HostProfile!
    updateHostProfile(input: HostProfileUpdateInput!): HostProfile!
    upsertHostPayoutAccount(input: HostPayoutAccountInput!): HostPayoutAccount!
    requestHostPayout(input: HostPayoutRequestInput!): HostPayout!
    upsertHostCancellationPolicy(hotelId: ID!, input: CancellationPolicyInput!): CancellationPolicy!
    createHostQuickReply(input: QuickReplyInput!): QuickReplyTemplate!
    deleteHostQuickReply(templateId: ID!): DeleteResult!
    createHostScheduledMessage(input: ScheduledMessageInput!): ScheduledMessage!
    cancelHostScheduledMessage(messageId: ID!): ScheduledMessage!
    addHostCoHost(hotelId: ID!, input: AddCoHostInput!): CoHostAssignment!
    removeHostCoHost(hotelId: ID!, assignmentId: ID!): DeleteResult!
    upsertHostComplianceChecklist(hotelId: ID!, input: ComplianceChecklistInput!): HotelComplianceChecklist!
    upsertHostListingQuality(hotelId: ID!, input: ListingQualityInput!): HotelListingToolkit!
    createHostClaim(input: HostClaimInput!): HostClaim!
    adjudicateHostClaim(claimId: ID!, input: AdjudicateClaimInput!): HostClaim!
    validatePromotion(input: PromotionValidateInput!): PromotionValidation!
    addSearchHistory(input: SearchHistoryInput!): SearchHistoryItem!
    clearSearchHistory: DeleteResult!
    createInvoice(input: InvoiceCreateInput!): InvoiceDocument!
    revokeInvoice(invoiceId: ID!, reason: String): InvoiceDocument!
    runInvoiceStorageAudit(input: InvoiceStorageAuditInput): InvoiceStorageAudit!
    createReview(input: ReviewCreateInput!): Review!
    updateReview(reviewId: ID!, input: ReviewUpdateInput!): Review!
    deleteReview(reviewId: ID!): DeleteResult!
  }
`;
exports.graphQLResolvers = {
    Query: {
        me: async (_parent, _args, context) => {
            const authUser = (0, context_1.requireAuth)(context);
            return auth_service_1.authService.getCurrentUser(authUser.userId);
        },
        hotelById: async (_parent, args) => {
            const hotel = await hotel_service_1.hotelService.getHotelById(args.id);
            return normalizeHotel(hotel);
        },
        searchHotels: async (_parent, args, context) => {
            const payload = hotel_schema_1.searchHotelsSchema.parse(args.input);
            const result = await hotel_service_1.hotelService.searchHotels({
                ...payload,
                checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
                checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
                userId: context.authUser?.userId,
            });
            return {
                data: result.data.map((hotel) => normalizeHotel(hotel)),
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                pages: result.pagination.pages,
            };
        },
        myBookings: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return booking_service_1.bookingService.getMyBookings(auth.userId);
        },
        hostBookings: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.getHostBookings(auth.userId);
        },
        bookingById: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return booking_service_1.bookingService.getBookingById(auth.userId, args.bookingId);
        },
        bookingPricePreview: async (_parent, args) => {
            const parsed = booking_schema_1.previewSchema.parse(args.input);
            return booking_service_1.bookingService.getBookingPricePreview({
                ...parsed,
                checkIn: toDate(parsed.checkIn),
                checkOut: toDate(parsed.checkOut),
            });
        },
        reservationRisk: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = booking_schema_1.riskSchema.parse(args.input);
            return booking_service_1.bookingService.getReservationRisk(auth.userId, {
                ...parsed,
                checkIn: toDate(parsed.checkIn),
                checkOut: toDate(parsed.checkOut),
            });
        },
        rebookingOptions: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = booking_schema_1.rebookingSchema.parse({ reason: args.reason });
            return booking_service_1.bookingService.getRebookingOptions(auth.userId, args.bookingId, parsed.reason);
        },
        roomById: async (_parent, args) => {
            return room_service_1.roomService.getRoomById(args.roomId);
        },
        roomAvailability: async (_parent, args) => {
            const parsed = room_schema_1.roomDateRangeQuerySchema.parse(args.input);
            return room_service_1.roomService.checkAvailability(args.roomId, toDate(parsed.checkIn), toDate(parsed.checkOut));
        },
        roomPricing: async (_parent, args) => {
            const parsed = room_schema_1.roomDateRangeQuerySchema.parse(args.input);
            return room_service_1.roomService.getPricing(args.roomId, {
                checkIn: toDate(parsed.checkIn),
                checkOut: toDate(parsed.checkOut),
            });
        },
        paymentById: async (_parent, args) => {
            return payment_service_1.paymentService.getById(args.paymentId);
        },
        paymentByBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return payment_service_1.paymentService.getByBooking(auth.userId, args.bookingId);
        },
        paymentQueueSummary: async (_parent, _args, context) => {
            (0, context_1.requireRole)(context, ["admin"]);
            return payment_service_1.paymentService.getPaymentQueueSummary();
        },
        fxRates: async () => payment_service_1.paymentService.listFxRates(),
        messageThread: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return messages_service_1.messageService.getThread(auth.userId, args.otherUserId);
        },
        conversations: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return messages_service_1.messageService.getConversations(auth.userId);
        },
        unreadMessagesCount: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return messages_service_1.messageService.getUnreadCount(auth.userId);
        },
        notifications: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return notifications_service_1.notificationService.list(auth.userId);
        },
        unreadNotificationsCount: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return notifications_service_1.notificationService.unreadCount(auth.userId);
        },
        notificationPreferences: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return notifications_service_1.notificationService.getPreferences(auth.userId);
        },
        authSessions: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return auth_service_1.authService.listSessions(auth.userId);
        },
        userDocuments: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return users_service_1.userService.listDocuments(auth.userId);
        },
        hostVerification: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return users_service_1.userService.getHostVerification(auth.userId);
        },
        loyaltySummary: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return users_service_1.userService.getLoyaltySummary(auth.userId);
        },
        identityVerification: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return users_service_1.userService.getIdentityVerification(auth.userId);
        },
        wishlist: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return wishlist_service_1.wishlistService.list(auth.userId, args.listName);
        },
        wishlistCollections: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return wishlist_service_1.wishlistService.listCollections(auth.userId);
        },
        wishlistShared: async (_parent, args) => wishlist_service_1.wishlistService.getSharedList(args.shareCode),
        wishlistInvites: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return wishlist_service_1.wishlistService.listInvites(auth.userId);
        },
        supportTickets: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return support_service_1.supportService.getTickets(auth.userId);
        },
        supportTicket: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return support_service_1.supportService.getTicket(auth.userId, args.ticketId);
        },
        supportRoutingConsole: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = support_schema_1.routingConsoleQuerySchema.parse({ days: args.days });
            return support_service_1.supportService.getSafetyOpsRoutingConsole(auth.userId, parsed.days);
        },
        supportOpsDashboard: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = support_schema_1.opsDashboardQuerySchema.parse({ days: args.days });
            return support_service_1.supportService.getOpsDashboard(auth.userId, parsed.days);
        },
        incidents: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = reports_schema_1.listSchema.parse(args);
            return reports_service_1.reportService.listIncidents(auth.userId, parsed);
        },
        incidentById: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return reports_service_1.reportService.getIncident(auth.userId, args.incidentId);
        },
        airCoverBoard: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return reports_service_1.reportService.getAirCoverBoard(auth.userId);
        },
        offPlatformFeeCases: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return reports_service_1.reportService.listOffPlatformFeeCases(auth.userId);
        },
        hostProfile: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_profile_service_1.hostProfileService.getProfile(auth.userId);
        },
        hostFinanceEarnings: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ months: args.months });
            return host_finance_service_1.hostFinanceService.getEarningsOverview(auth.userId, parsed.months);
        },
        hostFinanceTransactions: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ limit: args.limit });
            return host_finance_service_1.hostFinanceService.getTransactions(auth.userId, parsed.limit);
        },
        hostPayoutAccount: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_finance_service_1.hostFinanceService.getPayoutAccount(auth.userId);
        },
        hostPayoutHistory: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_finance_schema_1.hostFinanceQuerySchema.parse({ limit: args.limit });
            return host_finance_service_1.hostFinanceService.getPayoutHistory(auth.userId, parsed.limit);
        },
        hostCancellationPolicy: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.getCancellationPolicy(args.hotelId, auth.userId);
        },
        hostQuickReplies: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.listQuickReplies(auth.userId);
        },
        hostScheduledMessages: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.listScheduledMessages(auth.userId);
        },
        hostAnalytics: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.analyticsQuerySchema.parse({ days: args.days });
            return host_tools_service_1.hostToolsService.getAnalytics(auth.userId, parsed.days);
        },
        hostCoHosts: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.listCoHosts(args.hotelId, auth.userId);
        },
        hostComplianceChecklist: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.getComplianceChecklist(args.hotelId, auth.userId);
        },
        hostListingQuality: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.getListingQuality(args.hotelId, auth.userId);
        },
        hostClaims: async (_parent, _args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.listClaims(auth.userId);
        },
        hostComplianceAudit: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.auditExportQuerySchema.parse({ days: args.days });
            return host_tools_service_1.hostToolsService.exportComplianceAudit(auth.userId, parsed.days);
        },
        promotions: async () => promotions_service_1.promotionService.list(),
        searchHistory: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return search_history_service_1.searchHistoryService.list(auth.userId);
        },
        invoices: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = invoices_schema_1.listFilterSchema.parse(args);
            return invoicing_service_1.invoicingService.listDocuments(auth.userId, parsed);
        },
        invoiceAccessUrl: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = invoices_schema_1.accessUrlSchema.parse({ expiresIn: args.expiresIn });
            return invoicing_service_1.invoicingService.getDocumentAccessUrl(auth.userId, args.invoiceId, parsed.expiresIn);
        },
        reviews: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const where = args.bookingId
                ? { bookingId: args.bookingId }
                : {
                    OR: [
                        { senderId: auth.userId },
                        { receiverId: auth.userId },
                        { booking: { userId: auth.userId } },
                    ],
                };
            return database_1.prisma.review.findMany({
                where,
                include: {
                    sender: { select: { id: true, name: true, avatar: true } },
                    receiver: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: "desc" },
            });
        },
        reviewById: async (_parent, args, context) => {
            (0, context_1.requireAuth)(context);
            return database_1.prisma.review.findUnique({
                where: { id: args.reviewId },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } },
                    receiver: { select: { id: true, name: true, avatar: true } },
                },
            });
        },
        reviewByBooking: async (_parent, args, context) => {
            (0, context_1.requireAuth)(context);
            return database_1.prisma.review.findFirst({
                where: { bookingId: args.bookingId },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } },
                    receiver: { select: { id: true, name: true, avatar: true } },
                },
            });
        },
    },
    Mutation: {
        register: async (_parent, args) => {
            const payload = auth_schema_1.registerSchema.parse(args.input);
            return auth_service_1.authService.register(payload.email, payload.password, payload.name, payload.role);
        },
        login: async (_parent, args) => {
            const payload = auth_schema_1.loginSchema.parse(args.input);
            return auth_service_1.authService.login(payload.email, payload.password);
        },
        createHotel: async (_parent, args, context) => {
            const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
            const payload = hotel_schema_1.createHotelSchema.parse(args.input);
            const hotel = await hotel_service_1.hotelService.createHotel(authUser.userId, payload);
            return normalizeHotel(hotel);
        },
        createBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = booking_schema_1.createBookingSchema.parse(args.input);
            return booking_service_1.bookingService.createBooking(auth.userId, {
                ...parsed,
                checkIn: toDate(parsed.checkIn),
                checkOut: toDate(parsed.checkOut),
            });
        },
        updateBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = booking_schema_1.updateSchema.parse(args.input);
            return booking_service_1.bookingService.updateBooking(auth.userId, args.bookingId, {
                ...parsed,
                checkIn: parsed.checkIn ? toDate(parsed.checkIn) : undefined,
                checkOut: parsed.checkOut ? toDate(parsed.checkOut) : undefined,
            });
        },
        cancelBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return booking_service_1.bookingService.cancelBooking(auth.userId, args.bookingId, args.reason);
        },
        confirmCheckIn: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.confirmCheckIn(auth.userId, args.bookingId);
        },
        confirmCheckOut: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.confirmCheckOut(auth.userId, args.bookingId);
        },
        hostAcceptBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.hostAcceptBooking(auth.userId, args.bookingId);
        },
        hostDeclineBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.hostDeclineBooking(auth.userId, args.bookingId, args.reason);
        },
        hostAlterBooking: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = booking_schema_1.hostAlterSchema.parse(args.input);
            return booking_service_1.bookingService.hostAlterBooking(auth.userId, args.bookingId, {
                ...parsed,
                checkIn: parsed.checkIn ? toDate(parsed.checkIn) : undefined,
                checkOut: parsed.checkOut ? toDate(parsed.checkOut) : undefined,
            });
        },
        hostMarkNoShow: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return booking_service_1.bookingService.hostMarkNoShow(auth.userId, args.bookingId, args.notes);
        },
        createRoom: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = room_schema_1.createRoomSchema.parse(args.input);
            return room_service_1.roomService.createRoom(args.hotelId, auth.userId, parsed);
        },
        updateRoom: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = room_schema_1.updateRoomSchema.parse(args.input);
            return room_service_1.roomService.updateRoom(args.roomId, auth.userId, parsed);
        },
        deleteRoom: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            await room_service_1.roomService.deleteRoom(args.roomId, auth.userId);
            return { deleted: true, message: "Room deleted successfully" };
        },
        roomPresignedUrl: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = room_schema_1.presignedUrlQuerySchema.parse({ fileName: args.fileName });
            return room_service_1.roomService.getPresignedUrl(args.roomId, auth.userId, parsed.fileName);
        },
        deleteRoomImage: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return room_service_1.roomService.deleteImage(args.roomId, auth.userId, args.imageKey);
        },
        createPaymentOrder: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = payments_schema_1.createPaymentSchema.parse(args.input);
            const result = await payment_service_1.paymentService.createOrder(auth.userId, parsed.bookingId);
            return {
                idempotent: Boolean(result.idempotent),
                order: result.order,
                payment: result.payment,
            };
        },
        reprocessStalePayments: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = payments_schema_1.reprocessStaleSchema.parse(args.input || {});
            return payment_service_1.paymentService.reprocessStalePayments(auth.userId, parsed);
        },
        upsertFxRate: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = payments_schema_1.fxRateSchema.parse(args.input);
            return payment_service_1.paymentService.upsertFxRate(auth.userId, parsed);
        },
        sendMessage: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = messages_schema_1.sendMessageSchema.parse(args.input);
            const receiverUserId = parsed.receiverUserId || parsed.receiverId;
            return messages_service_1.messageService.sendMessage(auth.userId, receiverUserId, parsed.content, parsed.bookingId, parsed.attachmentUrl, parsed.attachmentType, parsed.escalateToSupport);
        },
        markMessageRead: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const result = await messages_service_1.messageService.markAsRead(auth.userId, args.messageId);
            return { count: result.count };
        },
        markNotificationRead: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const result = await notifications_service_1.notificationService.markRead(auth.userId, args.notificationId);
            return { count: result.count };
        },
        markAllNotificationsRead: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const result = await notifications_service_1.notificationService.markAllRead(auth.userId);
            return { count: result.count };
        },
        updateNotificationPreferences: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = notifications_schema_1.preferencesSchema.parse(args.input);
            return notifications_service_1.notificationService.updatePreferences(auth.userId, parsed);
        },
        deleteNotification: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            await notifications_service_1.notificationService.delete(auth.userId, args.notificationId);
            return { deleted: true, message: "Notification deleted" };
        },
        logout: async () => ({ success: true, message: "Logout successful" }),
        updateMyProfile: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = auth_schema_1.updateProfileSchema.parse(args.input);
            return auth_service_1.authService.updateProfile(auth.userId, parsed);
        },
        verifyEmail: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return auth_service_1.authService.verifyEmail(auth.userId);
        },
        refreshToken: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return auth_service_1.authService.refreshToken(auth.userId);
        },
        forgotPassword: async (_parent, args) => {
            const parsed = auth_schema_1.forgotPasswordSchema.parse(args);
            return auth_service_1.authService.forgotPassword(parsed.email);
        },
        resetPassword: async (_parent, args) => {
            const parsed = auth_schema_1.resetPasswordSchema.parse(args.input);
            const result = await auth_service_1.authService.resetPassword(parsed.token, parsed.newPassword);
            return {
                success: Boolean(result.success),
                message: "Password reset successful",
            };
        },
        revokeSession: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            await auth_service_1.authService.revokeSession(auth.userId, args.sessionId);
            return { success: true, message: "Session revoked" };
        },
        revokeOtherSessions: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            await auth_service_1.authService.revokeOtherSessions(auth.userId, auth.sessionId);
            return { success: true, message: "Other sessions revoked" };
        },
        setupMfa: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return auth_service_1.authService.setupMfa(auth.userId);
        },
        verifyMfa: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = auth_schema_1.mfaVerifySchema.parse(args.input);
            return auth_service_1.authService.verifyMfa(auth.userId, parsed.code);
        },
        addUserDocument: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = users_schema_1.addDocumentSchema.parse(args.input);
            return users_service_1.userService.addDocument(auth.userId, parsed.documentType, parsed.docUrl);
        },
        deleteUserDocument: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            await users_service_1.userService.deleteDocument(auth.userId, args.docId);
            return { deleted: true, message: "Document deleted" };
        },
        updateUserProfile: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = users_schema_1.updateProfileSchema.parse(args.input);
            return users_service_1.userService.updateProfile(auth.userId, parsed);
        },
        wishlistAdd: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = wishlist_schema_1.roomIdSchema.parse(args.input);
            return wishlist_service_1.wishlistService.add(auth.userId, parsed.roomId, parsed.listName);
        },
        wishlistRemove: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = wishlist_schema_1.roomIdSchema.parse(args.input);
            await wishlist_service_1.wishlistService.remove(auth.userId, parsed.roomId, parsed.listName);
            return { deleted: true, message: "Room removed from wishlist" };
        },
        wishlistCreateShare: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = wishlist_schema_1.shareSchema.parse(args.input);
            return wishlist_service_1.wishlistService.createShareLink(auth.userId, parsed.listName);
        },
        wishlistInvite: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = wishlist_schema_1.inviteSchema.parse(args.input);
            return wishlist_service_1.wishlistService.inviteCollaborator(auth.userId, parsed.listName, parsed.email, parsed.permission);
        },
        wishlistAccept: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = wishlist_schema_1.acceptInviteSchema.parse(args.input);
            return wishlist_service_1.wishlistService.acceptInvite(auth.userId, parsed.inviteId);
        },
        supportCreateTicket: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = support_schema_1.createTicketSchema.parse(args.input);
            return support_service_1.supportService.createTicket(auth.userId, parsed.subject, parsed.description, parsed.priority);
        },
        supportReply: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = support_schema_1.replySchema.parse(args.input);
            return support_service_1.supportService.replyToTicket(auth.userId, args.ticketId, parsed.reply);
        },
        supportEscalate: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = support_schema_1.escalationSchema.parse(args.input);
            return support_service_1.supportService.escalateEmergencyTicket(auth.userId, args.ticketId, parsed.stage, parsed.notes);
        },
        supportCreateEmergency: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = support_schema_1.emergencySchema.parse(args.input);
            return support_service_1.supportService.createEmergencyTicket(auth.userId, parsed.description, parsed.bookingId, parsed.locationHint);
        },
        reportIncident: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = reports_schema_1.createSchema.parse(args.input);
            return reports_service_1.reportService.reportIncident(auth.userId, parsed.bookingId, parsed.description);
        },
        updateIncidentStatus: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = reports_schema_1.statusSchema.parse(args.input);
            return reports_service_1.reportService.updateIncidentStatus(auth.userId, args.incidentId, parsed.status, parsed.resolution);
        },
        resolveIncident: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = reports_schema_1.resolveSchema.parse(args.input);
            return reports_service_1.reportService.resolveIncident(auth.userId, args.incidentId, parsed.resolution);
        },
        createOffPlatformFeeCase: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = reports_schema_1.offPlatformFeeSchema.parse(args.input);
            return reports_service_1.reportService.createOffPlatformFeeCase(auth.userId, parsed);
        },
        createHostProfile: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host"]);
            const parsed = host_profile_schema_1.profileSchema.parse(args.input);
            return host_profile_service_1.hostProfileService.createProfile(auth.userId, parsed);
        },
        updateHostProfile: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_profile_schema_1.updateProfileSchema.parse(args.input);
            return host_profile_service_1.hostProfileService.updateProfile(auth.userId, parsed);
        },
        upsertHostPayoutAccount: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_finance_schema_1.payoutAccountSchema.parse(args.input);
            return host_finance_service_1.hostFinanceService.upsertPayoutAccount(auth.userId, parsed);
        },
        requestHostPayout: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_finance_schema_1.payoutRequestSchema.parse(args.input);
            return host_finance_service_1.hostFinanceService.requestPayout(auth.userId, parsed.amount, parsed.notes);
        },
        upsertHostCancellationPolicy: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.cancellationSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.upsertCancellationPolicy(args.hotelId, auth.userId, parsed);
        },
        createHostQuickReply: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.quickReplySchema.parse(args.input);
            return host_tools_service_1.hostToolsService.createQuickReply(auth.userId, parsed);
        },
        deleteHostQuickReply: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            await host_tools_service_1.hostToolsService.deleteQuickReply(auth.userId, args.templateId);
            return { deleted: true, message: "Quick reply deleted" };
        },
        createHostScheduledMessage: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.scheduledMessageSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.createScheduledMessage(auth.userId, {
                ...parsed,
                sendAt: new Date(parsed.sendAt),
            });
        },
        cancelHostScheduledMessage: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            return host_tools_service_1.hostToolsService.cancelScheduledMessage(auth.userId, args.messageId);
        },
        addHostCoHost: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.addCohostSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.addCoHost(args.hotelId, auth.userId, parsed);
        },
        removeHostCoHost: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            await host_tools_service_1.hostToolsService.removeCoHost(args.hotelId, auth.userId, args.assignmentId);
            return { deleted: true, message: "Co-host removed" };
        },
        upsertHostComplianceChecklist: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.complianceSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.upsertComplianceChecklist(args.hotelId, auth.userId, parsed);
        },
        upsertHostListingQuality: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.listingQualitySchema.parse(args.input);
            return host_tools_service_1.hostToolsService.upsertListingQuality(args.hotelId, auth.userId, parsed);
        },
        createHostClaim: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
            const parsed = host_tools_schema_1.claimSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.createClaim(auth.userId, parsed);
        },
        adjudicateHostClaim: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = host_tools_schema_1.adjudicateClaimSchema.parse(args.input);
            return host_tools_service_1.hostToolsService.adjudicateClaim(auth.userId, args.claimId, parsed);
        },
        validatePromotion: async (_parent, args) => {
            const parsed = promotions_schema_1.validateSchema.parse(args.input);
            return promotions_service_1.promotionService.validate(parsed.code, parsed.subtotal);
        },
        addSearchHistory: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = search_history_schema_1.createSchema.parse(args.input);
            return search_history_service_1.searchHistoryService.add(auth.userId, {
                queryLocation: parsed.queryLocation,
                checkIn: parsed.checkIn ? new Date(parsed.checkIn) : undefined,
                checkOut: parsed.checkOut ? new Date(parsed.checkOut) : undefined,
                guests: parsed.guests,
            });
        },
        clearSearchHistory: async (_parent, _args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            await search_history_service_1.searchHistoryService.clear(auth.userId);
            return { deleted: true, message: "Search history cleared" };
        },
        createInvoice: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = invoices_schema_1.createInvoiceSchema.parse(args.input);
            return invoicing_service_1.invoicingService.createDocument(auth.userId, parsed);
        },
        revokeInvoice: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            return invoicing_service_1.invoicingService.revokeDocument(auth.userId, args.invoiceId, args.reason);
        },
        runInvoiceStorageAudit: async (_parent, args, context) => {
            const auth = (0, context_1.requireRole)(context, ["admin"]);
            const parsed = invoices_schema_1.storageAuditSchema.parse(args.input || {});
            return invoicing_service_1.invoicingService.auditStorageHealth(auth.userId, parsed);
        },
        createReview: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = review_schema_1.createReviewSchema.parse(args.input);
            return review_service_1.reviewService.createReview(auth.userId, parsed);
        },
        updateReview: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const parsed = review_schema_1.updateReviewSchema.parse(args.input);
            const existing = await database_1.prisma.review.findUnique({
                where: { id: args.reviewId },
            });
            if (!existing || existing.senderId !== auth.userId) {
                throw new Error("Review not found");
            }
            return database_1.prisma.review.update({
                where: { id: args.reviewId },
                data: {
                    ...(typeof parsed.rating === "number" && { rating: parsed.rating }),
                    ...(typeof parsed.comment === "string" && {
                        comment: parsed.comment,
                    }),
                    ...(parsed.categories && {
                        categories: JSON.stringify(parsed.categories),
                    }),
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } },
                    receiver: { select: { id: true, name: true, avatar: true } },
                },
            });
        },
        deleteReview: async (_parent, args, context) => {
            const auth = (0, context_1.requireAuth)(context);
            const existing = await database_1.prisma.review.findUnique({
                where: { id: args.reviewId },
            });
            if (!existing || existing.senderId !== auth.userId) {
                throw new Error("Review not found");
            }
            await database_1.prisma.review.delete({ where: { id: args.reviewId } });
            return { deleted: true, message: "Review deleted" };
        },
    },
    HotelRoomSummary: {
        amenities: (room) => toArray(room.amenities),
        images: (room) => toArray(room.images),
    },
    Room: {
        amenities: (room) => toArray(room.amenities),
        images: (room) => toArray(room.images),
    },
    Booking: {
        checkIn: (booking) => toIsoString(booking.checkIn),
        checkOut: (booking) => toIsoString(booking.checkOut),
        expiresAt: (booking) => toIsoString(booking.expiresAt),
        createdAt: (booking) => toIsoString(booking.createdAt),
        updatedAt: (booking) => toIsoString(booking.updatedAt),
        room: (booking) => booking.room ? normalizeRoom(booking.room) : null,
    },
    Payment: {
        createdAt: (payment) => toIsoString(payment.createdAt),
        updatedAt: (payment) => toIsoString(payment.updatedAt),
    },
    Message: {
        createdAt: (message) => toIsoString(message.createdAt),
        updatedAt: (message) => toIsoString(message.updatedAt),
    },
    Notification: {
        createdAt: (notification) => toIsoString(notification.createdAt),
        updatedAt: (notification) => toIsoString(notification.updatedAt),
    },
    Conversation: {
        lastMessageAt: (conversation) => toIsoString(conversation.lastMessageAt),
    },
    FxRate: {
        effectiveAt: (fxRate) => toIsoString(fxRate.effectiveAt),
        createdAt: (fxRate) => toIsoString(fxRate.createdAt),
        updatedAt: (fxRate) => toIsoString(fxRate.updatedAt),
    },
    SessionRecord: {
        createdAt: (record) => toIsoString(record.createdAt),
        lastSeenAt: (record) => toIsoString(record.lastSeenAt),
    },
    UserDocument: {
        createdAt: (doc) => toIsoString(doc.createdAt),
    },
    HostVerification: {
        approvedAt: (item) => toIsoString(item.approvedAt),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    IdentityDocument: {
        createdAt: (doc) => toIsoString(doc.createdAt),
    },
    WishlistItem: {
        addedAt: (item) => toIsoString(item.addedAt),
        room: (item) => item.room ? normalizeRoom(item.room) : null,
    },
    WishlistInvite: {
        createdAt: (invite) => toIsoString(invite.createdAt),
    },
    SupportTicket: {
        createdAt: (ticket) => toIsoString(ticket.createdAt),
        updatedAt: (ticket) => toIsoString(ticket.updatedAt),
    },
    RoutingTicket: {
        createdAt: (item) => toIsoString(item.createdAt),
    },
    RoutingIncident: {
        createdAt: (item) => toIsoString(item.createdAt),
    },
    IncidentReport: {
        resolvedAt: (item) => toIsoString(item.resolvedAt),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    ChargebackCase: {
        evidenceUrls: (item) => toArray(item.evidenceUrls),
        timeline: (item) => toArray(item.timeline),
        createdAt: (item) => toIsoString(item.createdAt),
    },
    OffPlatformFeeCase: {
        evidenceUrls: (item) => toArray(item.evidenceUrls),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HostProfile: {
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HostTransaction: {
        createdAt: (item) => toIsoString(item.createdAt),
        checkIn: (item) => toIsoString(item.checkIn),
        checkOut: (item) => toIsoString(item.checkOut),
    },
    HostPayoutAccount: {
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HostPayout: {
        requestedAt: (item) => toIsoString(item.requestedAt),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    SearchHistoryItem: {
        checkIn: (item) => toIsoString(item.checkIn),
        checkOut: (item) => toIsoString(item.checkOut),
        createdAt: (item) => toIsoString(item.createdAt),
    },
    CancellationPolicy: {
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    QuickReplyTemplate: {
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    ScheduledMessage: {
        sendAt: (item) => toIsoString(item.sendAt),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    CoHostAssignment: {
        permissions: (item) => toArray(item.permissions),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HotelComplianceChecklist: {
        checklistItems: (item) => {
            const entries = toUnknownArray(item.checklistItems);
            return entries
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => {
                const parsed = entry;
                return {
                    label: String(parsed.label ?? ""),
                    completed: Boolean(parsed.completed),
                };
            });
        },
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HotelListingToolkit: {
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    HostClaimBooking: {
        checkIn: (item) => toIsoString(item.checkIn),
        checkOut: (item) => toIsoString(item.checkOut),
    },
    HostClaim: {
        evidenceUrls: (item) => toArray(item.evidenceUrls),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    InvoiceDocument: {
        lineItems: (item) => {
            const entries = toUnknownArray(item.lineItems);
            return entries
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => {
                const parsed = entry;
                return {
                    description: String(parsed.description ?? ""),
                    amount: Number(parsed.amount ?? 0),
                };
            });
        },
        metadata: (item) => toMetadataEntries(item.metadata),
        issuedAt: (item) => toIsoString(item.issuedAt),
        revokedAt: (item) => toIsoString(item.revokedAt),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
    Review: {
        categories: (item) => toMetadataEntries(item.categories),
        createdAt: (item) => toIsoString(item.createdAt),
        updatedAt: (item) => toIsoString(item.updatedAt),
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commerceTypeDefs = void 0;
exports.commerceTypeDefs = `
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
  }`;

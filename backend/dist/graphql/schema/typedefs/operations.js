"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsTypeDefs = void 0;
exports.operationsTypeDefs = `
  type Query {
    me: User!
    hotelById(id: ID!): Hotel!
    searchHotels(input: SearchHotelsInput!): SearchHotelsResponse!
    myBookings: [Booking!]!
    hostBookings: [Booking!]!
    bookingById(bookingId: ID!): Booking!
    bookingCancellationPreview(bookingId: ID!): CancellationPreview!
    bookingPricePreview(input: CreateBookingInput!): BookingPricePreview!
    reservationRisk(input: CreateBookingInput!): ReservationRisk!
    rebookingOptions(bookingId: ID!, reason: String!): RebookingOptionsResult!
    roomById(roomId: ID!): Room!
    myHotels: [Hotel!]!
    promotedHotels(limit: Int): [Hotel!]!
    hotelBlockedDates(hotelId: ID!): [BlockedDate!]!
    hotelCalendarRules(hotelId: ID!): HotelCalendarRule
    hotelIcalSources(hotelId: ID!): [HotelIcalSource!]!
    hotelPricingRules(hotelId: ID!): HotelPricingRule
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
    updateHotel(hotelId: ID!, input: UpdateHotelInput!): Hotel!
    deleteHotel(hotelId: ID!): DeleteResult!
    promoteHotel(hotelId: ID!, durationDays: Int): HotelPromotionState!
    unpromoteHotel(hotelId: ID!): HotelPromotionState!
    blockHotelDates(hotelId: ID!, input: BlockDatesInput!): [BlockedDate!]!
    upsertHotelCalendarRules(hotelId: ID!, input: HotelCalendarRulesInput!): HotelCalendarRule!
    createHotelIcalSource(hotelId: ID!, input: HotelIcalSourceInput!): HotelIcalSource!
    deleteHotelIcalSource(hotelId: ID!, sourceId: ID!): DeleteResult!
    syncHotelIcalSource(hotelId: ID!, sourceId: ID!): HotelIcalImportResult!
    importHotelIcal(hotelId: ID!, input: HotelIcalImportInput!): HotelIcalImportResult!
    upsertHotelPricingRules(hotelId: ID!, input: HotelPricingRulesInput!): HotelPricingRule!
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
    verifyPayment(input: VerifyPaymentInput!): Payment!
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
  }`;

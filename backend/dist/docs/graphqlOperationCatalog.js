"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphQLOperationMarkdown = exports.getGraphQLOperationCatalog = void 0;
const operations_1 = require("../graphql/schema/typedefs/operations");
const extractTypeBlock = (typeName) => {
    const regex = new RegExp(`type\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`);
    const match = operations_1.operationsTypeDefs.match(regex);
    return match?.[1] || "";
};
const SCALAR_TYPES = new Set(["String", "ID", "Int", "Float", "Boolean"]);
const INPUT_EXAMPLES = {
    RegisterInput: {
        email: "guest@example.com",
        password: "StrongPass#123",
        name: "Aarav Sharma",
        role: "guest",
    },
    LoginInput: {
        email: "guest@example.com",
        password: "StrongPass#123",
    },
    CreateHotelInput: {
        name: "Skyline Suites",
        description: "Premium city-view suites near downtown.",
        location: "Bengaluru, Karnataka",
        amenities: ["wifi", "parking", "pool"],
        publicRules: "No smoking. Quiet hours 10 PM to 7 AM.",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        instantBooking: true,
    },
    SearchHotelsInput: {
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 8,
        checkIn: "2026-04-15T00:00:00.000Z",
        checkOut: "2026-04-18T00:00:00.000Z",
        guests: 2,
        minPrice: 2500,
        maxPrice: 9000,
        instantBooking: true,
        minRating: 4,
        sortBy: "recommended",
        page: 1,
        limit: 10,
    },
    CreateBookingInput: {
        roomId: "room_101",
        checkIn: "2026-04-15T00:00:00.000Z",
        checkOut: "2026-04-18T00:00:00.000Z",
        guestCount: 2,
        notes: "Late evening check-in expected.",
    },
    UpdateBookingInput: {
        guestCount: 3,
        checkIn: "2026-04-16T00:00:00.000Z",
        checkOut: "2026-04-19T00:00:00.000Z",
        notes: "Updated travel plans.",
    },
    RoomDateRangeInput: {
        checkIn: "2026-04-15T00:00:00.000Z",
        checkOut: "2026-04-18T00:00:00.000Z",
    },
    CreateRoomInput: {
        roomType: "Deluxe",
        capacity: 2,
        maxGuests: 3,
        basePrice: 4500,
        amenities: ["wifi", "ac", "workspace"],
    },
    UpdateRoomInput: {
        basePrice: 5000,
        maxGuests: 4,
        amenities: ["wifi", "ac", "workspace", "breakfast"],
    },
    CreatePaymentOrderInput: {
        bookingId: "booking_001",
    },
    ReprocessStalePaymentsInput: {
        olderThanMinutes: 30,
        limit: 25,
        dryRun: true,
    },
    FxRateInput: {
        baseCurrency: "INR",
        quoteCurrency: "USD",
        rate: 0.012,
        provider: "manual",
    },
    SendMessageInput: {
        receiverUserId: "user_host_1",
        content: "Can I check in early around 1 PM?",
        bookingId: "booking_001",
    },
    NotificationPreferencesInput: {
        inApp: true,
        email: true,
        push: true,
        booking: true,
        message: true,
        payment: true,
        marketing: false,
    },
    AuthProfileUpdateInput: {
        name: "Aarav S.",
        avatar: "https://cdn.example.com/avatar/aarav.png",
    },
    ResetPasswordInput: {
        token: "reset_token_abc123",
        newPassword: "NewStrongPass#123",
    },
    VerifyMfaInput: {
        code: "123456",
    },
    AddUserDocumentInput: {
        documentType: "passport",
        docUrl: "https://cdn.example.com/docs/passport.pdf",
    },
    UserProfileUpdateInput: {
        name: "Aarav Sharma",
        avatar: "https://cdn.example.com/avatar/aarav-v2.png",
    },
    WishlistAddInput: {
        roomId: "room_101",
        listName: "Summer Trip",
    },
    WishlistRemoveInput: {
        roomId: "room_101",
        listName: "Summer Trip",
    },
    WishlistShareInput: {
        listName: "Summer Trip",
    },
    WishlistInviteInput: {
        listName: "Summer Trip",
        email: "friend@example.com",
        permission: "editor",
    },
    WishlistAcceptInput: {
        inviteId: "invite_001",
    },
    SupportTicketInput: {
        subject: "Refund status update",
        description: "Refund has not reflected even after 5 business days.",
        priority: "high",
    },
    SupportReplyInput: {
        reply: "Sharing payment receipt and booking timeline.",
    },
    SupportEscalationInput: {
        stage: "active_response",
        notes: "Guest safety team has been notified.",
    },
    SupportEmergencyInput: {
        description: "Urgent safety concern at property entrance.",
        bookingId: "booking_001",
        locationHint: "North gate, tower B",
    },
    IncidentCreateInput: {
        bookingId: "booking_001",
        description: "Water leakage reported in bathroom.",
    },
    IncidentStatusInput: {
        status: "investigating",
        resolution: "Maintenance assigned and inspection in progress.",
    },
    IncidentResolveInput: {
        resolution: "Issue resolved. Room restored and guest compensated.",
    },
    OffPlatformFeeInput: {
        bookingId: "booking_001",
        description: "Host requested off-platform payment.",
        evidenceUrls: ["https://cdn.example.com/evidence/chat-screenshot.png"],
    },
    HostProfileInput: {
        companyName: "Skyline Hospitality LLP",
        website: "https://skyline.example.com",
        businessType: "agency",
        description: "Boutique hosting partner across tier-1 cities.",
    },
    HostProfileUpdateInput: {
        description: "Superhost team with 24x7 guest support.",
    },
    HostPayoutAccountInput: {
        accountHolderName: "Skyline Hospitality LLP",
        bankName: "HDFC Bank",
        accountNumber: "112233445566",
        ifscCode: "HDFC0001234",
        payoutMethod: "bank_transfer",
    },
    HostPayoutRequestInput: {
        amount: 12500,
        notes: "Weekly settlement request",
    },
    CancellationPolicyInput: {
        policyType: "moderate",
        freeCancellationHours: 48,
        partialRefundPercent: 50,
        noShowPenaltyPercent: 100,
    },
    QuickReplyInput: {
        title: "Check-in Instructions",
        content: "Please carry a valid ID and arrive after 2 PM for smooth check-in.",
        category: "checkin",
    },
    ScheduledMessageInput: {
        receiverUserId: "user_guest_1",
        bookingId: "booking_001",
        content: "Hope your stay was comfortable. Safe travels!",
        sendAt: "2026-04-19T06:30:00.000Z",
    },
    AddCoHostInput: {
        cohostUserId: "user_host_2",
        permissions: ["calendar", "messaging"],
        revenueSplitPercent: 20,
    },
    ComplianceChecklistInput: {
        jurisdictionCode: "KA-BLR",
        checklistItems: [
            { label: "Fire extinguisher installed", completed: true },
            { label: "Emergency exits marked", completed: true },
        ],
        status: "in_review",
    },
    ListingQualityInput: {
        coverImageUrl: "https://cdn.example.com/hotels/skyline/cover.jpg",
        guidebook: "Nearby transport, food spots, and emergency contacts.",
        houseManual: "Noise policy, appliance usage, and support contact flow.",
        checkInSteps: "Collect keycard from reception and verify booking ID.",
    },
    HostClaimInput: {
        hotelId: "hotel_001",
        bookingId: "booking_001",
        title: "Damaged bedside lamp",
        description: "Lamp broken during stay; replacement required.",
        amountClaimed: 1800,
        evidenceUrls: ["https://cdn.example.com/claims/lamp-damage.jpg"],
    },
    AdjudicateClaimInput: {
        status: "approved",
        resolutionNote: "Evidence verified and claim approved.",
    },
    PromotionValidateInput: {
        code: "WELCOME10",
        subtotal: 6500,
    },
    SearchHistoryInput: {
        queryLocation: "Goa",
        checkIn: "2026-05-05T00:00:00.000Z",
        checkOut: "2026-05-08T00:00:00.000Z",
        guests: 2,
    },
    InvoiceCreateInput: {
        type: "payment",
        title: "Booking Payment Invoice",
        bookingId: "booking_001",
        amount: 12500,
        currency: "INR",
        lineItems: [
            { description: "3-night stay", amount: 10500 },
            { description: "Service fee", amount: 2000 },
        ],
    },
    InvoiceStorageAuditInput: {
        limit: 100,
        olderThanDays: 30,
        repairMissing: true,
        dryRun: false,
    },
    ReviewCreateInput: {
        bookingId: "booking_001",
        receiverId: "user_host_1",
        rating: 5,
        comment: "Great stay, very responsive host.",
        hotelId: "hotel_001",
    },
    ReviewUpdateInput: {
        rating: 4,
        comment: "Updating after follow-up; overall good experience.",
    },
};
const RESPONSE_EXAMPLES = {
    User: {
        id: "user_001",
        email: "guest@example.com",
        name: "Aarav Sharma",
        role: "guest",
        verified: true,
    },
    AuthPayload: {
        token: "jwt_token_example",
        user: {
            id: "user_001",
            email: "guest@example.com",
            name: "Aarav Sharma",
            role: "guest",
        },
    },
    SearchHotelsResponse: {
        page: 1,
        limit: 10,
        total: 124,
        pages: 13,
        data: [
            {
                id: "hotel_001",
                name: "Skyline Suites",
                location: "Bengaluru, Karnataka",
                instantBooking: true,
            },
        ],
    },
    Hotel: {
        id: "hotel_001",
        name: "Skyline Suites",
        location: "Bengaluru, Karnataka",
        instantBooking: true,
    },
    Room: {
        id: "room_101",
        roomType: "Deluxe",
        maxGuests: 3,
        basePrice: 4500,
    },
    Booking: {
        id: "booking_001",
        roomId: "room_101",
        status: "confirmed",
        checkIn: "2026-04-15T00:00:00.000Z",
        checkOut: "2026-04-18T00:00:00.000Z",
        amount: 12500,
    },
    BookingPricePreview: {
        roomId: "room_101",
        nights: 3,
        nightlyBasePrice: 4000,
        pricing: { subtotal: 12000, serviceFee: 300, tax: 1200, total: 13500 },
    },
    ReservationRisk: {
        riskScore: 28,
        riskLevel: "low",
        recommendation: "allow",
    },
    RebookingOptionsResult: {
        bookingId: "booking_001",
        reason: "overbooking",
        comparableOptions: [{ roomId: "room_203", basePrice: 4700 }],
    },
    RoomAvailability: {
        isAvailable: true,
        reason: "No overlapping bookings",
    },
    RoomPricing: {
        basePrice: 4500,
        nights: 3,
        subtotal: 13500,
        taxes: 1350,
        total: 14850,
        currency: "INR",
    },
    Payment: {
        id: "payment_001",
        bookingId: "booking_001",
        amount: 12500,
        status: "completed",
    },
    PaymentQueueSummary: {
        total: 24,
        pending: 2,
        processing: 1,
        completed: 20,
        failed: 1,
    },
    PaymentOrderResult: {
        idempotent: false,
        order: { id: "order_123", amount: 12500, currency: "INR" },
        payment: { id: "payment_001", status: "pending" },
    },
    ReprocessStalePaymentsResult: {
        dryRun: true,
        scanned: 10,
        processedCount: 2,
        skippedCount: 8,
    },
    FxRate: {
        id: "fx_001",
        baseCurrency: "INR",
        quoteCurrency: "USD",
        rate: 0.012,
    },
    Message: {
        id: "msg_001",
        senderId: "user_001",
        receiverId: "user_host_1",
        content: "Can I check in early?",
        read: false,
    },
    Conversation: {
        userId: "user_host_1",
        userName: "Host Priya",
        lastMessage: "Sure, early check-in possible.",
        unreadCount: 1,
    },
    UnreadMessagesCount: { unreadCount: 3 },
    Notification: {
        id: "notif_001",
        type: "booking_update",
        content: "Your booking is confirmed",
        read: false,
    },
    UnreadCount: { count: 4 },
    NotificationPreferences: {
        inApp: true,
        email: true,
        push: true,
        booking: true,
        message: true,
    },
    SessionRecord: {
        sessionId: "sess_001",
        userId: "user_001",
        createdAt: "2026-03-30T10:00:00.000Z",
        lastSeenAt: "2026-03-31T08:15:00.000Z",
    },
    UserDocument: {
        id: "doc_001",
        userId: "user_001",
        documentType: "passport",
        status: "verified",
    },
    HostVerification: {
        id: "hv_001",
        userId: "user_host_1",
        kycStatus: "approved",
    },
    LoyaltySummary: {
        tier: "Silver",
        rewardPoints: 1200,
        totalSpent: 56000,
        completedStays: 6,
    },
    IdentityVerification: {
        userId: "user_001",
        stage: "verified",
        checks: { governmentId: true, addressProof: true, selfieMatch: true },
    },
    WishlistItem: {
        id: "wish_001",
        roomId: "room_101",
        listName: "Summer Trip",
    },
    WishlistCollection: { name: "Summer Trip", count: 3 },
    SharedWishlist: {
        listName: "Summer Trip",
        items: [{ id: "wish_001", roomId: "room_101" }],
    },
    WishlistInvite: {
        id: "invite_001",
        listName: "Summer Trip",
        permission: "editor",
        read: false,
    },
    WishlistShareLink: {
        shareCode: "share_abc123",
        shareUrl: "https://app.example.com/wishlist/shared/share_abc123",
        listName: "Summer Trip",
    },
    WishlistInviteCreateResult: {
        inviteId: "invite_001",
        shareCode: "share_abc123",
        permission: "editor",
    },
    WishlistAcceptResult: {
        accepted: true,
        importedItems: 3,
        listName: "Summer Trip",
        permission: "editor",
    },
    SupportTicket: {
        id: "ticket_001",
        subject: "Refund status update",
        priority: "high",
        status: "open",
    },
    EmergencyTicketResult: {
        escalationStage: "active_response",
        ticket: { id: "ticket_911", priority: "urgent", status: "in_progress" },
    },
    SupportRoutingConsole: {
        lookbackDays: 7,
        queue: { urgentSupportTickets: [], activeIncidents: [] },
    },
    SupportOpsDashboard: {
        lookbackDays: 30,
        support: { total: 120, resolved: 108, slaResolutionRate: 0.9 },
    },
    IncidentReport: {
        id: "incident_001",
        bookingId: "booking_001",
        status: "investigating",
        description: "Water leakage reported in bathroom.",
    },
    AirCoverBoard: {
        generatedAt: "2026-03-31T09:00:00.000Z",
        incidents: [{ id: "incident_001", status: "open" }],
    },
    OffPlatformFeeCase: {
        id: "opf_001",
        bookingId: "booking_001",
        status: "open",
        description: "Host requested off-platform payment.",
    },
    HostProfile: {
        id: "host_profile_001",
        companyName: "Skyline Hospitality LLP",
        businessType: "agency",
    },
    HostEarningsOverview: {
        totalGross: 250000,
        totalNet: 212000,
        paidBookingsCount: 35,
    },
    HostTransaction: {
        bookingId: "booking_001",
        grossAmount: 12500,
        netAmount: 11250,
        paymentStatus: "completed",
    },
    HostPayoutAccount: {
        id: "payout_acc_001",
        bankName: "HDFC Bank",
        accountNumberLast4: "5566",
        payoutMethod: "bank_transfer",
    },
    HostPayoutHistory: {
        availableForPayout: 45000,
        payouts: [{ id: "payout_001", amount: 12000, status: "paid" }],
    },
    HostPayout: {
        id: "payout_002",
        amount: 12500,
        status: "requested",
    },
    CancellationPolicy: {
        hotelId: "hotel_001",
        policyType: "moderate",
        freeCancellationHours: 48,
    },
    QuickReplyTemplate: {
        id: "qr_001",
        title: "Check-in Instructions",
        category: "checkin",
    },
    ScheduledMessage: {
        id: "sm_001",
        bookingId: "booking_001",
        status: "scheduled",
        sendAt: "2026-04-19T06:30:00.000Z",
    },
    HostAnalytics: {
        rangeDays: 30,
        totals: { bookings: 52, confirmed: 44, revenue: 312000 },
    },
    CoHostAssignment: {
        id: "cohost_001",
        cohostUserId: "user_host_2",
        permissions: ["calendar", "messaging"],
    },
    HotelComplianceChecklist: {
        id: "comp_001",
        status: "in_review",
        checklistItems: [{ label: "Fire extinguisher installed", completed: true }],
    },
    HotelListingToolkit: {
        id: "toolkit_001",
        completenessScore: 86,
    },
    HostClaim: {
        id: "claim_001",
        bookingId: "booking_001",
        status: "approved",
        amountClaimed: 1800,
    },
    ComplianceAudit: {
        lookbackDays: 90,
        totals: { complianceRecords: 12, claims: 3 },
    },
    Promotion: {
        code: "WELCOME10",
        description: "10% off first booking",
        minSubtotal: 3000,
    },
    PromotionValidation: {
        code: "WELCOME10",
        subtotal: 6500,
        discountAmount: 650,
        finalSubtotal: 5850,
    },
    SearchHistoryItem: {
        id: "search_001",
        queryLocation: "Goa",
        guests: 2,
    },
    InvoiceDocument: {
        id: "inv_001",
        title: "Booking Payment Invoice",
        documentNumber: "INV-2026-0001",
        status: "issued",
        amount: 12500,
    },
    InvoiceAccessUrl: {
        fileUrl: "https://cdn.example.com/invoices/inv_001.pdf",
        expiresInSeconds: 1800,
    },
    InvoiceStorageAudit: {
        dryRun: false,
        scanned: 100,
        repaired: 2,
        failedRepairs: 0,
    },
    Review: {
        id: "review_001",
        bookingId: "booking_001",
        rating: 5,
        comment: "Great stay and responsive host.",
    },
    PresignedUrlResult: {
        presignedUrl: "https://storage.example.com/upload?signature=abc",
        bucket: "hotel-assets",
        objectKey: "rooms/room_101/image.jpg",
    },
    DeleteResult: {
        deleted: true,
        message: "Operation completed successfully",
    },
    SimpleResult: {
        success: true,
        message: "Operation completed successfully",
    },
    TokenResult: {
        token: "jwt_token_refreshed",
    },
    ForgotPasswordResult: {
        message: "Password reset link has been sent",
    },
    MfaSetupResult: {
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/HotelNew:user@example.com?secret=JBSWY3DPEHPK3PXP",
        expiresInSeconds: 300,
    },
    MfaVerifyResult: {
        enabled: true,
    },
};
const RETURN_SELECTIONS = {
    User: "id email name avatar role verified",
    AuthPayload: "token user { id email name role }",
    Hotel: "id name location instantBooking amenities createdAt",
    SearchHotelsResponse: "page limit total pages data { id name location instantBooking }",
    Room: "id hotelId roomType maxGuests basePrice amenities",
    Booking: "id userId roomId checkIn checkOut guestCount notes amount status createdAt",
    BookingPricePreview: "roomId hotelId nights guestCount nightlyBasePrice pricing { subtotal serviceFee tax total }",
    ReservationRisk: "riskScore riskLevel recommendation",
    RebookingOptionsResult: "bookingId reason comparableOptions { roomId hotelId basePrice }",
    RoomAvailability: "isAvailable reason",
    RoomPricing: "basePrice nights subtotal taxes total currency",
    Payment: "id bookingId amount status createdAt",
    PaymentQueueSummary: "total pending processing completed failed refunded queued staleProcessing",
    PaymentOrderResult: "idempotent order { id amount currency queued } payment { id status amount }",
    ReprocessStalePaymentsResult: "dryRun scanned processedCount skippedCount processedPaymentIds skippedPaymentIds",
    FxRate: "id baseCurrency quoteCurrency rate provider effectiveAt",
    Message: "id senderId receiverId bookingId content read createdAt",
    Conversation: "userId userName userAvatar lastMessage lastMessageAt unreadCount bookingId",
    UnreadMessagesCount: "unreadCount",
    Notification: "id type content link read createdAt",
    UnreadCount: "count",
    NotificationPreferences: "inApp email push booking message payment marketing",
    SessionRecord: "sessionId userId createdAt lastSeenAt",
    UserDocument: "id userId documentType docUrl status createdAt",
    HostVerification: "id userId kycStatus taxId approvedAt",
    LoyaltySummary: "tier rewardPoints totalSpent completedStays referralCode benefits",
    IdentityVerification: "userId stage checks { governmentId addressProof selfieMatch } requiredActions",
    WishlistItem: "id userId roomId listName addedAt",
    WishlistCollection: "name count",
    SharedWishlist: "listName owner { id name } items { id roomId listName }",
    WishlistInvite: "id read createdAt ownerId listName shareCode permission",
    WishlistShareLink: "shareCode shareUrl listName",
    WishlistInviteCreateResult: "inviteId shareCode permission invitee { id email name }",
    WishlistAcceptResult: "accepted importedItems listName permission",
    SupportTicket: "id userId subject description priority status reply createdAt updatedAt",
    EmergencyTicketResult: "escalationStage immediateSteps ticket { id subject priority status }",
    SupportRoutingConsole: "generatedAt lookbackDays routingSuggestions { trustAndSafetyPod frontlineSupport }",
    SupportOpsDashboard: "generatedAt lookbackDays support { total resolved slaResolutionRate } safety { totalIncidents resolved }",
    IncidentReport: "id bookingId reportedByUserId description status resolution resolvedAt createdAt",
    AirCoverBoard: "generatedAt incidents { id status } emergencyTickets { id status }",
    OffPlatformFeeCase: "id bookingId reporterUserId description status evidenceUrls createdAt",
    HostProfile: "id userId companyName website businessType description createdAt updatedAt",
    HostEarningsOverview: "totalGross totalServiceFee totalTax totalNet pendingPayoutAmount paidBookingsCount",
    HostTransaction: "bookingId createdAt bookingStatus grossAmount paymentStatus serviceFee tax netAmount",
    HostPayoutAccount: "id userId accountHolderName bankName accountNumberLast4 ifscCode payoutMethod",
    HostPayoutHistory: "availableForPayout payouts { id amount status requestedAt }",
    HostPayout: "id userId amount status notes requestedAt",
    CancellationPolicy: "id hotelId policyType freeCancellationHours partialRefundPercent noShowPenaltyPercent",
    QuickReplyTemplate: "id userId title content category createdAt",
    ScheduledMessage: "id senderUserId receiverUserId bookingId content sendAt status createdAt",
    HostAnalytics: "rangeDays totals { bookings confirmed cancelled revenue avgRating }",
    CoHostAssignment: "id hotelId hostUserId cohostUserId permissions revenueSplitPercent createdAt",
    HotelComplianceChecklist: "id hotelId jurisdictionCode checklistItems { label completed } status",
    HotelListingToolkit: "id hotelId coverImageUrl guidebook houseManual checkInSteps completenessScore",
    HostClaim: "id hotelId bookingId hostUserId title description amountClaimed status resolutionNote",
    ComplianceAudit: "generatedAt lookbackDays totals { complianceRecords claims } csv",
    Promotion: "code description minSubtotal",
    PromotionValidation: "code description discountAmount subtotal finalSubtotal",
    SearchHistoryItem: "id userId queryLocation checkIn checkOut guests createdAt",
    InvoiceDocument: "id userId bookingId paymentId type status title documentNumber amount currency fileUrl issuedAt",
    InvoiceAccessUrl: "fileUrl signedUrl expiresInSeconds",
    InvoiceStorageAudit: "dryRun repairMissing scanned missingStorageRefs missingObjects repaired failedRepairs",
    Review: "id senderId receiverId bookingId hotelId rating comment createdAt updatedAt",
    PresignedUrlResult: "presignedUrl bucket objectKey",
    DeleteResult: "deleted message",
    SimpleResult: "success message",
    TokenResult: "token",
    ForgotPasswordResult: "message resetToken resetUrl expiresIn",
    MfaSetupResult: "secret otpauthUrl expiresInSeconds",
    MfaVerifyResult: "enabled",
};
const toOperationName = (name) => `${name[0].toUpperCase()}${name.slice(1)}`;
const unwrapType = (type) => type.replace(/[[\]!\s]/g, "");
// eslint-disable-next-line sonarjs/slow-regex
const isListType = (type) => /\[.*\]/.test(type);
const ID_KEYWORD_SAMPLES = [
    ["booking", "booking_001"],
    ["hotel", "hotel_001"],
    ["room", "room_101"],
    ["payment", "payment_001"],
    ["review", "review_001"],
    ["notification", "notif_001"],
    ["ticket", "ticket_001"],
    ["incident", "incident_001"],
    ["claim", "claim_001"],
    ["session", "sess_001"],
    ["doc", "doc_001"],
];
const STRING_KEYWORD_SAMPLES = [
    ["email", "user@example.com"],
    ["password", "password123"],
    ["token", "sample_token"],
    ["code", "CODE123"],
    ["reason", "sample reason"],
    ["status", "active"],
    ["name", "Sample Name"],
];
const findKeywordSample = (key, samples) => samples.find(([needle]) => key.includes(needle))?.[1];
const sampleScalarValue = (typeName, argName) => {
    const key = (argName || "").toLowerCase();
    if (typeName === "Boolean")
        return true;
    if (typeName === "Int") {
        return ["day", "month", "limit"].some((token) => key.includes(token))
            ? 7
            : 1;
    }
    if (typeName === "Float")
        return 100.5;
    if (typeName === "ID") {
        return findKeywordSample(key, ID_KEYWORD_SAMPLES) || "id_123";
    }
    return findKeywordSample(key, STRING_KEYWORD_SAMPLES) || "sample";
};
const cloneValue = (value) => {
    if (value === null || value === undefined)
        return value;
    if (typeof value !== "object")
        return value;
    return JSON.parse(JSON.stringify(value));
};
const sampleVariableValue = (type, argName) => {
    const baseType = unwrapType(type);
    if (INPUT_EXAMPLES[baseType]) {
        const example = cloneValue(INPUT_EXAMPLES[baseType]);
        return isListType(type) ? [example] : example;
    }
    const baseSample = SCALAR_TYPES.has(baseType)
        ? sampleScalarValue(baseType, argName)
        : {
            id: `${baseType.toLowerCase()}_001`,
        };
    if (isListType(type)) {
        return [baseSample];
    }
    return baseSample;
};
const sampleResponseValue = (type) => {
    const baseType = unwrapType(type);
    if (RESPONSE_EXAMPLES[baseType]) {
        const example = cloneValue(RESPONSE_EXAMPLES[baseType]);
        return isListType(type) ? [example] : example;
    }
    const baseSample = SCALAR_TYPES.has(baseType)
        ? sampleScalarValue(baseType)
        : {
            __typename: baseType,
        };
    if (isListType(type)) {
        return [baseSample];
    }
    return baseSample;
};
const parseArguments = (argsRaw) => {
    if (!argsRaw || !argsRaw.trim())
        return [];
    return argsRaw
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
        const match = chunk.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^\s]+)$/);
        if (!match)
            return null;
        return {
            name: match[1],
            type: match[2],
        };
    })
        .filter((entry) => Boolean(entry));
};
const parseSignature = (signature) => {
    const match = signature.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?\s*:\s*([^\s]+)$/);
    if (!match) {
        return null;
    }
    const [, name, argsRaw, returnType] = match;
    const args = parseArguments(argsRaw);
    return {
        name,
        args,
        returnType,
    };
};
const buildRequestExample = (kind, name, args, returnType) => {
    const operationName = toOperationName(name);
    const baseReturn = unwrapType(returnType);
    const needsSelection = !SCALAR_TYPES.has(baseReturn);
    const selectionFields = RETURN_SELECTIONS[baseReturn] || "__typename";
    const selection = needsSelection ? ` { ${selectionFields} }` : "";
    if (!args.length) {
        return {
            operationName,
            query: `${kind} ${operationName} { ${name}${selection} }`,
        };
    }
    const variableDefinitions = args
        .map((arg) => `$${arg.name}: ${arg.type}`)
        .join(", ");
    const argumentAssignments = args
        .map((arg) => `${arg.name}: $${arg.name}`)
        .join(", ");
    return {
        operationName,
        query: `${kind} ${operationName}(${variableDefinitions}) { ${name}(${argumentAssignments})${selection} }`,
        variables: Object.fromEntries(args.map((arg) => [arg.name, sampleVariableValue(arg.type, arg.name)])),
    };
};
const buildResponseExample = (name, returnType) => ({
    data: {
        [name]: sampleResponseValue(returnType),
    },
});
const parseOperations = (kind, block) => block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((signature) => {
    const parsed = parseSignature(signature);
    if (!parsed)
        return null;
    return {
        kind,
        name: parsed.name,
        signature,
        args: parsed.args,
        returnType: parsed.returnType,
        requestExample: buildRequestExample(kind, parsed.name, parsed.args, parsed.returnType),
        responseExample: buildResponseExample(parsed.name, parsed.returnType),
    };
})
    .filter((entry) => Boolean(entry));
const getGraphQLOperationCatalog = () => {
    const queryBlock = extractTypeBlock("Query");
    const mutationBlock = extractTypeBlock("Mutation");
    return {
        queries: parseOperations("query", queryBlock),
        mutations: parseOperations("mutation", mutationBlock),
    };
};
exports.getGraphQLOperationCatalog = getGraphQLOperationCatalog;
const escapePipe = (value) => value.replace(/\|/g, "\\|");
const toMarkdownRows = (operations) => operations
    .map((operation) => `| ${operation.name} | ${escapePipe(operation.signature)} |`)
    .join("\n");
const toExampleSections = (operations) => operations
    .map((operation) => {
    const requestJson = JSON.stringify(operation.requestExample, null, 2);
    const responseJson = JSON.stringify(operation.responseExample, null, 2);
    return [
        `#### ${operation.kind.toUpperCase()} ${operation.name}`,
        "Request",
        "```json",
        requestJson,
        "```",
        "Response",
        "```json",
        responseJson,
        "```",
    ].join("\n");
})
    .join("\n\n");
const getGraphQLOperationMarkdown = () => {
    const { queries, mutations } = (0, exports.getGraphQLOperationCatalog)();
    const querySection = [
        "### Query Operations",
        "| Operation | Signature |",
        "| --- | --- |",
        toMarkdownRows(queries),
    ].join("\n");
    const mutationSection = [
        "### Mutation Operations",
        "| Operation | Signature |",
        "| --- | --- |",
        toMarkdownRows(mutations),
    ].join("\n");
    const queryExamples = [
        "### Query Request/Response Examples",
        toExampleSections(queries),
    ].join("\n\n");
    const mutationExamples = [
        "### Mutation Request/Response Examples",
        toExampleSections(mutations),
    ].join("\n\n");
    return [querySection, mutationSection, queryExamples, mutationExamples].join("\n\n");
};
exports.getGraphQLOperationMarkdown = getGraphQLOperationMarkdown;

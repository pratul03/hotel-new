import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const toIsoDateTime = (value?: unknown): string | undefined => {
  if (typeof value !== "string" || !value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
};

const toPath = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/api/, "") || "/";
    } catch {
      return url;
    }
  }
  return url;
};

const asPagination = <T>(
  items: T[],
  page: number,
  limit: number,
): {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} => {
  const total = items.length;
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 10);
  const start = (safePage - 1) * safeLimit;
  const data = items.slice(start, start + safeLimit);
  return {
    data,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: safePage * safeLimit < total,
  };
};

const normalizeNotification = (notification: Record<string, any>) => {
  const type = String(notification.type || "system");
  const message = String(notification.content || "");
  const title =
    type.charAt(0).toUpperCase() +
    type.slice(1) +
    (message ? " Update" : " Notification");

  return {
    ...notification,
    title,
    message,
    data: notification.link ? { link: notification.link } : undefined,
  };
};

const normalizePayment = (payment: Record<string, any>) => {
  const authUser = useAuthStore.getState().user;
  return {
    ...payment,
    userId: authUser?.id,
    currency: "INR",
  };
};

const asFiniteNumber = (
  value: unknown,
  fallback?: number,
): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }

  return num;
};

const DEFAULT_SEARCH_LAT = 22.5726;
const DEFAULT_SEARCH_LNG = 88.3639;

const toGraphqlPayload = (adapter: AdapterConfig) => {
  const payload: {
    query: string;
    variables?: Record<string, unknown>;
    operationName?: string;
  } = {
    query: adapter.query,
    variables: adapter.variables,
  };

  const opName = String(adapter.operationName || "").trim();
  if (!opName) {
    return payload;
  }

  const declaredOperationMatch = adapter.query.match(
    /\b(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)\b/,
  );
  const declaredOperationName = declaredOperationMatch?.[1];

  // If names differ only by casing, align with the declared operation name.
  if (
    declaredOperationName &&
    opName.toLowerCase() === declaredOperationName.toLowerCase()
  ) {
    payload.operationName = declaredOperationName;
    return payload;
  }

  const escaped = opName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const opPattern = new RegExp(
    `\\b(?:query|mutation|subscription)\\s+${escaped}\\b`,
  );

  // Send operationName only when it matches the document operation name exactly.
  if (opPattern.test(adapter.query)) {
    payload.operationName = opName;
  }

  return payload;
};

type AdapterConfig = {
  operationName: string;
  query: string;
  variables?: Record<string, unknown>;
  transform: (result: any) => any;
};

const buildAdapterConfig = (
  method: string,
  path: string,
  params: Record<string, any>,
  body: Record<string, any>,
): AdapterConfig | null => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);

  if (method === "post" && path === "/auth/login") {
    return {
      operationName: "login",
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
              email
              name
              avatar
              role
              verified
              superhost
              responseRate
              createdAt
            }
          }
        }
      `,
      variables: { input: body },
      transform: (result) => ({
        ...result,
        success: true,
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/auth/register") {
    return {
      operationName: "register",
      query: `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user {
              id
              email
              name
              avatar
              role
              verified
              superhost
              responseRate
              createdAt
            }
          }
        }
      `,
      variables: { input: body },
      transform: (result) => ({
        ...result,
        success: true,
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/auth/logout") {
    return {
      operationName: "logout",
      query: `mutation Logout { logout { success message } }`,
      transform: (result) => ({
        success: result?.success ?? true,
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/auth/forgot-password") {
    return {
      operationName: "forgotPassword",
      query: `mutation ForgotPassword($email: String!) { forgotPassword(email: $email) { message resetToken resetUrl expiresIn } }`,
      variables: { email: body.email },
      transform: (result) => ({
        success: true,
        data: result,
        statusCode: 200,
        message: result?.message,
      }),
    };
  }

  if (method === "post" && path === "/auth/reset-password") {
    return {
      operationName: "resetPassword",
      query: `mutation ResetPassword($input: ResetPasswordInput!) { resetPassword(input: $input) { success message } }`,
      variables: { input: body },
      transform: (result) => ({
        success: Boolean(result?.success),
        data: result,
        statusCode: 200,
        message: result?.message,
      }),
    };
  }

  if (method === "post" && path === "/auth/verify-email") {
    return {
      operationName: "verifyEmail",
      query: `mutation VerifyEmail { verifyEmail { id verified email name role } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/auth/resend-verification") {
    return {
      operationName: "refreshToken",
      query: `mutation RefreshToken { refreshToken { token } }`,
      transform: () => ({
        success: true,
        data: { sent: true },
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/auth/sessions") {
    return {
      operationName: "authSessions",
      query: `query AuthSessions { authSessions { sessionId userId createdAt lastSeenAt } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  const revokeSessionMatch = path.match(/^\/auth\/sessions\/([^/]+)$/);
  if (method === "delete" && revokeSessionMatch) {
    return {
      operationName: "revokeSession",
      query: `mutation RevokeSession($sessionId: ID!) { revokeSession(sessionId: $sessionId) { success message } }`,
      variables: { sessionId: revokeSessionMatch[1] },
      transform: (result) => ({
        success: Boolean(result?.success),
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/auth/sessions/revoke-others") {
    return {
      operationName: "revokeOtherSessions",
      query: `mutation RevokeOtherSessions { revokeOtherSessions { success message } }`,
      transform: (result) => ({
        success: Boolean(result?.success),
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/auth/mfa/setup") {
    return {
      operationName: "setupMfa",
      query: `mutation SetupMfa { setupMfa { secret otpauthUrl expiresInSeconds } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/auth/mfa/verify") {
    return {
      operationName: "verifyMfa",
      query: `mutation VerifyMfa($input: VerifyMfaInput!) { verifyMfa(input: $input) { enabled } }`,
      variables: { input: { code: body.code } },
      transform: (result) => ({
        success: Boolean(result?.enabled),
        data: result,
        statusCode: 200,
      }),
    };
  }

  const userProfileMatch = path.match(/^\/users\/([^/]+)\/profile$/);
  if (method === "get" && userProfileMatch) {
    return {
      operationName: "me",
      query: `query Me { me { id email name avatar role verified superhost responseRate createdAt } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "put" && userProfileMatch) {
    return {
      operationName: "updateUserProfile",
      query: `mutation UpdateUserProfile($input: UserProfileUpdateInput!) { updateUserProfile(input: $input) { id email name avatar role verified superhost responseRate } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const userDocumentsMatch = path.match(/^\/users\/([^/]+)\/documents$/);
  if (method === "get" && userDocumentsMatch) {
    return {
      operationName: "userDocuments",
      query: `query UserDocuments { userDocuments { id userId documentType docUrl status createdAt } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  const verifyDocumentMatch = path.match(/^\/users\/([^/]+)\/verify-document$/);
  if (method === "post" && verifyDocumentMatch) {
    return {
      operationName: "addUserDocument",
      query: `mutation AddUserDocument($input: AddUserDocumentInput!) { addUserDocument(input: $input) { id userId documentType docUrl status createdAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const loyaltyMatch = path.match(/^\/users\/([^/]+)\/loyalty$/);
  if (method === "get" && loyaltyMatch) {
    return {
      operationName: "loyaltySummary",
      query: `query LoyaltySummary { loyaltySummary { tier rewardPoints totalSpent completedStays referralCode personalizationSignals { searches } nextTierTarget { tier staysRequired spendRequired } } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/support/tickets") {
    return {
      operationName: "supportCreateTicket",
      query: `mutation SupportCreateTicket($input: SupportTicketInput!) { supportCreateTicket(input: $input) { id userId subject description priority status reply createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/support/emergency") {
    return {
      operationName: "supportCreateEmergency",
      query: `mutation SupportCreateEmergency($input: SupportEmergencyInput!) { supportCreateEmergency(input: $input) { escalationStage immediateSteps ticket { id status priority subject description createdAt } } }`,
      variables: {
        input: {
          description: body.description,
          bookingId: body.bookingId,
          locationHint: body.locationHint,
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/promotions/validate") {
    return {
      operationName: "validatePromotion",
      query: `mutation ValidatePromotion($input: PromotionValidateInput!) { validatePromotion(input: $input) { code description discountAmount subtotal finalSubtotal } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/reviews") {
    return {
      operationName: "createReview",
      query: `mutation CreateReview($input: ReviewCreateInput!) { createReview(input: $input) { id bookingId receiverId senderId hotelId rating comment categories { key value } createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/messages/conversations") {
    return {
      operationName: "conversations",
      query: `query Conversations { conversations { userId userName userAvatar lastMessage hasAttachment attachmentType lastMessageAt unreadCount bookingId } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  const threadMatch = path.match(/^\/messages\/thread\/([^/]+)$/);
  if (method === "get" && threadMatch) {
    return {
      operationName: "messageThread",
      query: `query MessageThread($otherUserId: ID!) { messageThread(otherUserId: $otherUserId) { id senderId receiverId bookingId content attachmentUrl attachmentType hasAttachment messageType read createdAt updatedAt sender { id name avatar } receiver { id name avatar } escalatedTicketId } }`,
      variables: { otherUserId: threadMatch[1] },
      transform: (result) => asPagination(result ?? [], page, limit),
    };
  }

  if (method === "post" && path === "/messages") {
    return {
      operationName: "sendMessage",
      query: `mutation SendMessage($input: SendMessageInput!) { sendMessage(input: $input) { id senderId receiverId bookingId content attachmentUrl attachmentType read createdAt updatedAt sender { id name avatar } } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/notifications") {
    return {
      operationName: "notifications",
      query: `query Notifications { notifications { id userId type content link read createdAt updatedAt } }`,
      transform: (result) => {
        const normalized = (result ?? []).map((n: Record<string, any>) =>
          normalizeNotification(n),
        );
        return asPagination(normalized, page, limit);
      },
    };
  }

  if (method === "get" && path === "/notifications/unread-count") {
    return {
      operationName: "unreadNotificationsCount",
      query: `query UnreadNotificationsCount { unreadNotificationsCount { count } }`,
      transform: (result) => ({
        success: true,
        data: { count: Number(result?.count || 0) },
        statusCode: 200,
      }),
    };
  }

  const markReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (method === "patch" && markReadMatch) {
    return {
      operationName: "markNotificationRead",
      query: `mutation MarkNotificationRead($notificationId: ID!) { markNotificationRead(notificationId: $notificationId) { count } }`,
      variables: { notificationId: markReadMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "patch" && path === "/notifications/read-all") {
    return {
      operationName: "markAllNotificationsRead",
      query: `mutation MarkAllNotificationsRead { markAllNotificationsRead { count } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/notifications/preferences") {
    return {
      operationName: "notificationPreferences",
      query: `query NotificationPreferences { notificationPreferences { inApp email push booking message payment marketing } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "put" && path === "/notifications/preferences") {
    return {
      operationName: "updateNotificationPreferences",
      query: `mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) { updateNotificationPreferences(input: $input) { inApp email push booking message payment marketing } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/wishlist") {
    return {
      operationName: "wishlist",
      query: `query Wishlist($listName: String) { wishlist(listName: $listName) { id userId roomId listName addedAt room { id hotelId roomType maxGuests basePrice amenities images isAvailable hotel { id name location } } } }`,
      variables: { listName: params.listName },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/wishlist/lists") {
    return {
      operationName: "wishlistCollections",
      query: `query WishlistCollections { wishlistCollections { name count } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  const sharedWishlistMatch = path.match(/^\/wishlist\/shared\/([^/]+)$/);
  if (method === "get" && sharedWishlistMatch) {
    return {
      operationName: "wishlistShared",
      query: `query WishlistShared($shareCode: String!) { wishlistShared(shareCode: $shareCode) { owner { id name avatar } listName items { id userId roomId listName addedAt room { id hotelId roomType maxGuests basePrice amenities images isAvailable hotel { id name location } } } } }`,
      variables: { shareCode: sharedWishlistMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/wishlist/collaborate/share") {
    return {
      operationName: "wishlistCreateShare",
      query: `mutation WishlistCreateShare($input: WishlistShareInput!) { wishlistCreateShare(input: $input) { shareCode shareUrl listName } }`,
      variables: { input: { listName: body.listName } },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/wishlist/collaborate/invite") {
    return {
      operationName: "wishlistInvite",
      query: `mutation WishlistInvite($input: WishlistInviteInput!) { wishlistInvite(input: $input) { inviteId shareCode permission invitee { id email name } } }`,
      variables: {
        input: {
          listName: body.listName,
          email: body.email,
          permission: body.permission || "view",
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/wishlist/collaborate/invites") {
    return {
      operationName: "wishlistInvites",
      query: `query WishlistInvites { wishlistInvites { id read createdAt ownerId listName shareCode permission } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/wishlist/collaborate/accept") {
    return {
      operationName: "wishlistAccept",
      query: `mutation WishlistAccept($input: WishlistAcceptInput!) { wishlistAccept(input: $input) { accepted importedItems listName permission } }`,
      variables: { input: { inviteId: body.inviteId } },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/wishlist") {
    return {
      operationName: "wishlistAdd",
      query: `mutation WishlistAdd($input: WishlistAddInput!) { wishlistAdd(input: $input) { id userId roomId listName addedAt } }`,
      variables: { input: { roomId: body.roomId, listName: body.listName } },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const wishlistRemoveMatch = path.match(/^\/wishlist\/([^/]+)$/);
  if (method === "delete" && wishlistRemoveMatch) {
    return {
      operationName: "wishlistRemove",
      query: `mutation WishlistRemove($input: WishlistRemoveInput!) { wishlistRemove(input: $input) { deleted message } }`,
      variables: {
        input: {
          roomId: wishlistRemoveMatch[1],
          listName: params.listName,
        },
      },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/bookings") {
    return {
      operationName: "myBookings",
      query: `query MyBookings { myBookings { id userId roomId checkIn checkOut guestCount notes amount status expiresAt createdAt updatedAt room { id roomType maxGuests basePrice amenities images isAvailable hotel { id name location } } history { id bookingId status updatedBy notes changedAt } } }`,
      transform: (result) => asPagination(result ?? [], page, limit),
    };
  }

  if (method === "get" && path === "/bookings/host") {
    return {
      operationName: "hostBookings",
      query: `query HostBookings { hostBookings { id userId roomId checkIn checkOut guestCount notes amount status expiresAt createdAt updatedAt room { id roomType maxGuests basePrice amenities images isAvailable hotel { id name location } } history { id bookingId status updatedBy notes changedAt } } }`,
      transform: (result) => asPagination(result ?? [], page, limit),
    };
  }

  const bookingPreviewMatch = path.match(
    /^\/bookings\/([^/]+)\/cancellation-preview$/,
  );
  if (method === "get" && bookingPreviewMatch) {
    return {
      operationName: "bookingCancellationPreview",
      query: `query BookingCancellationPreview($bookingId: ID!) { bookingCancellationPreview(bookingId: $bookingId) { bookingId policyType hoursUntilCheckIn refundablePercent totalPaid refundableAmount nonRefundableAmount canCancel } }`,
      variables: { bookingId: bookingPreviewMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const bookingByIdMatch = path.match(/^\/bookings\/([^/]+)$/);
  if (method === "get" && bookingByIdMatch) {
    return {
      operationName: "bookingById",
      query: `query BookingById($bookingId: ID!) { bookingById(bookingId: $bookingId) { id userId roomId checkIn checkOut guestCount notes amount status expiresAt createdAt updatedAt room { id roomType maxGuests basePrice amenities images isAvailable hotel { id name location } } history { id bookingId status updatedBy notes changedAt } } }`,
      variables: { bookingId: bookingByIdMatch[1] },
      transform: (result) => result,
    };
  }

  if (method === "post" && path === "/bookings") {
    return {
      operationName: "createBooking",
      query: `mutation CreateBooking($input: CreateBookingInput!) { createBooking(input: $input) { id userId roomId checkIn checkOut guestCount notes amount status expiresAt createdAt updatedAt } }`,
      variables: {
        input: {
          roomId: body.roomId,
          checkIn: toIsoDateTime(body.checkIn),
          checkOut: toIsoDateTime(body.checkOut),
          guestCount: Number(body.guestCount || 1),
          notes: body.notes,
        },
      },
      transform: (result) => result,
    };
  }

  const bookingCancelMatch = path.match(/^\/bookings\/([^/]+)\/cancel$/);
  if (method === "patch" && bookingCancelMatch) {
    return {
      operationName: "cancelBooking",
      query: `mutation CancelBooking($bookingId: ID!, $reason: String) { cancelBooking(bookingId: $bookingId, reason: $reason) { id status notes updatedAt } }`,
      variables: { bookingId: bookingCancelMatch[1], reason: body.reason },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const confirmCheckinMatch = path.match(
    /^\/bookings\/([^/]+)\/confirm-checkin$/,
  );
  if (method === "post" && confirmCheckinMatch) {
    return {
      operationName: "confirmCheckIn",
      query: `mutation ConfirmCheckIn($bookingId: ID!) { confirmCheckIn(bookingId: $bookingId) { id status updatedAt } }`,
      variables: { bookingId: confirmCheckinMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hostAcceptMatch = path.match(/^\/bookings\/([^/]+)\/host\/accept$/);
  if (method === "post" && hostAcceptMatch) {
    return {
      operationName: "hostAcceptBooking",
      query: `mutation HostAcceptBooking($bookingId: ID!) { hostAcceptBooking(bookingId: $bookingId) { id status updatedAt } }`,
      variables: { bookingId: hostAcceptMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hostDeclineMatch = path.match(/^\/bookings\/([^/]+)\/host\/decline$/);
  if (method === "post" && hostDeclineMatch) {
    return {
      operationName: "hostDeclineBooking",
      query: `mutation HostDeclineBooking($bookingId: ID!, $reason: String) { hostDeclineBooking(bookingId: $bookingId, reason: $reason) { id status updatedAt notes } }`,
      variables: { bookingId: hostDeclineMatch[1], reason: body.reason },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hostAlterMatch = path.match(/^\/bookings\/([^/]+)\/host\/alter$/);
  if (method === "patch" && hostAlterMatch) {
    return {
      operationName: "hostAlterBooking",
      query: `mutation HostAlterBooking($bookingId: ID!, $input: UpdateBookingInput!) { hostAlterBooking(bookingId: $bookingId, input: $input) { id status checkIn checkOut guestCount notes updatedAt } }`,
      variables: {
        bookingId: hostAlterMatch[1],
        input: {
          guestCount: body.guestCount,
          checkIn: toIsoDateTime(body.checkIn),
          checkOut: toIsoDateTime(body.checkOut),
          notes: body.notes,
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hostNoShowMatch = path.match(/^\/bookings\/([^/]+)\/host\/no-show$/);
  if (method === "post" && hostNoShowMatch) {
    return {
      operationName: "hostMarkNoShow",
      query: `mutation HostMarkNoShow($bookingId: ID!, $notes: String) { hostMarkNoShow(bookingId: $bookingId, notes: $notes) { id status notes updatedAt } }`,
      variables: { bookingId: hostNoShowMatch[1], notes: body.notes },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/payments/create-order") {
    return {
      operationName: "createPaymentOrder",
      query: `mutation CreatePaymentOrder($input: CreatePaymentOrderInput!) { createPaymentOrder(input: $input) { idempotent order { id amount currency queued } payment { id bookingId razorpayOrderId razorpayPaymentId amount status createdAt updatedAt } } }`,
      variables: { input: { bookingId: body.bookingId } },
      transform: (result) => {
        const order = result?.order
          ? {
              ...result.order,
              receipt: body.bookingId,
            }
          : null;
        return {
          success: true,
          data: order,
          statusCode: 200,
        };
      },
    };
  }

  if (method === "post" && path === "/payments/verify") {
    return {
      operationName: "verifyPayment",
      query: `mutation VerifyPayment($input: VerifyPaymentInput!) { verifyPayment(input: $input) { id bookingId razorpayOrderId razorpayPaymentId amount status createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({
        success: true,
        data: normalizePayment(result),
        statusCode: 200,
      }),
    };
  }

  const paymentByBookingMatch = path.match(/^\/payments\/booking\/([^/]+)$/);
  if (method === "get" && paymentByBookingMatch) {
    return {
      operationName: "paymentByBooking",
      query: `query PaymentByBooking($bookingId: ID!) { paymentByBooking(bookingId: $bookingId) { id bookingId razorpayOrderId razorpayPaymentId amount status createdAt updatedAt } }`,
      variables: { bookingId: paymentByBookingMatch[1] },
      transform: (result) => ({
        success: true,
        data: normalizePayment(result),
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/host/profile") {
    return {
      operationName: "hostProfile",
      query: `query HostProfile { hostProfile { id userId companyName website businessType description createdAt updatedAt user { id name avatar } } }`,
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/host/profile") {
    return {
      operationName: "createHostProfile",
      query: `mutation CreateHostProfile($input: HostProfileInput!) { createHostProfile(input: $input) { id userId companyName website businessType description createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "put" && path === "/host/profile") {
    return {
      operationName: "updateHostProfile",
      query: `mutation UpdateHostProfile($input: HostProfileUpdateInput!) { updateHostProfile(input: $input) { id userId companyName website businessType description createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/host/finance/earnings") {
    return {
      operationName: "hostFinanceEarnings",
      query: `query HostFinanceEarnings($months: Int) { hostFinanceEarnings(months: $months) { totalGross totalServiceFee totalTax totalNet pendingPayoutAmount paidBookingsCount monthlyGross { month gross } } }`,
      variables: { months: Number(params.months || 6) },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/host/finance/transactions") {
    return {
      operationName: "hostFinanceTransactions",
      query: `query HostFinanceTransactions($limit: Int) { hostFinanceTransactions(limit: $limit) { bookingId createdAt checkIn checkOut bookingStatus grossAmount paymentStatus serviceFee tax netAmount guest { id name email } hotel { id name } room { id roomType } } }`,
      variables: { limit: Number(params.limit || 20) },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/host/finance/payout-account") {
    return {
      operationName: "hostPayoutAccount",
      query: `query HostPayoutAccount { hostPayoutAccount { id userId accountHolderName bankName accountNumberLast4 ifscCode payoutMethod upiId createdAt updatedAt } }`,
      transform: (result) => ({
        success: true,
        data: result ?? null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && path === "/host/finance/payout-account") {
    return {
      operationName: "upsertHostPayoutAccount",
      query: `mutation UpsertHostPayoutAccount($input: HostPayoutAccountInput!) { upsertHostPayoutAccount(input: $input) { id userId accountHolderName bankName accountNumberLast4 ifscCode payoutMethod upiId createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/host/finance/payouts") {
    return {
      operationName: "hostPayoutHistory",
      query: `query HostPayoutHistory($limit: Int) { hostPayoutHistory(limit: $limit) { availableForPayout payouts { id userId amount status notes requestedAt createdAt updatedAt } } }`,
      variables: { limit: Number(params.limit || 20) },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "post" && path === "/host/finance/payouts/request") {
    return {
      operationName: "requestHostPayout",
      query: `mutation RequestHostPayout($input: HostPayoutRequestInput!) { requestHostPayout(input: $input) { id userId amount status notes requestedAt createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hostCancellationMatch = path.match(
    /^\/host\/tools\/hotels\/([^/]+)\/cancellation-policy$/,
  );
  if (method === "get" && hostCancellationMatch) {
    return {
      operationName: "hostCancellationPolicy",
      query: `query HostCancellationPolicy($hotelId: ID!) { hostCancellationPolicy(hotelId: $hotelId) { id hotelId policyType freeCancellationHours partialRefundPercent noShowPenaltyPercent createdAt updatedAt } }`,
      variables: { hotelId: hostCancellationMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && hostCancellationMatch) {
    return {
      operationName: "upsertHostCancellationPolicy",
      query: `mutation UpsertHostCancellationPolicy($hotelId: ID!, $input: CancellationPolicyInput!) { upsertHostCancellationPolicy(hotelId: $hotelId, input: $input) { id hotelId policyType freeCancellationHours partialRefundPercent noShowPenaltyPercent createdAt updatedAt } }`,
      variables: { hotelId: hostCancellationMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/host/tools/quick-replies") {
    return {
      operationName: "hostQuickReplies",
      query: `query HostQuickReplies { hostQuickReplies { id userId title content category createdAt updatedAt } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/host/tools/quick-replies") {
    return {
      operationName: "createHostQuickReply",
      query: `mutation CreateHostQuickReply($input: QuickReplyInput!) { createHostQuickReply(input: $input) { id userId title content category createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const quickReplyDeleteMatch = path.match(
    /^\/host\/tools\/quick-replies\/([^/]+)$/,
  );
  if (method === "delete" && quickReplyDeleteMatch) {
    return {
      operationName: "deleteHostQuickReply",
      query: `mutation DeleteHostQuickReply($templateId: ID!) { deleteHostQuickReply(templateId: $templateId) { deleted message } }`,
      variables: { templateId: quickReplyDeleteMatch[1] },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/host/tools/scheduled-messages") {
    return {
      operationName: "hostScheduledMessages",
      query: `query HostScheduledMessages { hostScheduledMessages { id senderUserId receiverUserId bookingId content sendAt status createdAt updatedAt receiver { id name avatar } } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/host/tools/scheduled-messages") {
    return {
      operationName: "createHostScheduledMessage",
      query: `mutation CreateHostScheduledMessage($input: ScheduledMessageInput!) { createHostScheduledMessage(input: $input) { id senderUserId receiverUserId bookingId content sendAt status createdAt updatedAt receiver { id name avatar } } }`,
      variables: {
        input: {
          ...body,
          sendAt: toIsoDateTime(body.sendAt),
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const scheduledCancelMatch = path.match(
    /^\/host\/tools\/scheduled-messages\/([^/]+)\/cancel$/,
  );
  if (method === "post" && scheduledCancelMatch) {
    return {
      operationName: "cancelHostScheduledMessage",
      query: `mutation CancelHostScheduledMessage($messageId: ID!) { cancelHostScheduledMessage(messageId: $messageId) { id status sendAt updatedAt } }`,
      variables: { messageId: scheduledCancelMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/host/tools/analytics") {
    return {
      operationName: "hostAnalytics",
      query: `query HostAnalytics($days: Int) { hostAnalytics(days: $days) { rangeDays totals { bookings confirmed checkedOut cancelled conversionRate cancellationRate revenue avgLeadTimeDays avgRating reviewsCount occupancyRate } dailySnapshots { date bookings confirmed revenue } } }`,
      variables: { days: Number(params.days || 30) },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const cohostsMatch = path.match(/^\/host\/tools\/hotels\/([^/]+)\/cohosts$/);
  if (method === "get" && cohostsMatch) {
    return {
      operationName: "hostCoHosts",
      query: `query HostCoHosts($hotelId: ID!) { hostCoHosts(hotelId: $hotelId) { id hotelId hostUserId cohostUserId permissions revenueSplitPercent createdAt updatedAt cohost { id name avatar } } }`,
      variables: { hotelId: cohostsMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && cohostsMatch) {
    return {
      operationName: "addHostCoHost",
      query: `mutation AddHostCoHost($hotelId: ID!, $input: AddCoHostInput!) { addHostCoHost(hotelId: $hotelId, input: $input) { id hotelId hostUserId cohostUserId permissions revenueSplitPercent createdAt updatedAt cohost { id name avatar } } }`,
      variables: { hotelId: cohostsMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const cohostDeleteMatch = path.match(
    /^\/host\/tools\/hotels\/([^/]+)\/cohosts\/([^/]+)$/,
  );
  if (method === "delete" && cohostDeleteMatch) {
    return {
      operationName: "removeHostCoHost",
      query: `mutation RemoveHostCoHost($hotelId: ID!, $assignmentId: ID!) { removeHostCoHost(hotelId: $hotelId, assignmentId: $assignmentId) { deleted message } }`,
      variables: {
        hotelId: cohostDeleteMatch[1],
        assignmentId: cohostDeleteMatch[2],
      },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  const complianceMatch = path.match(
    /^\/host\/tools\/hotels\/([^/]+)\/compliance-checklist$/,
  );
  if (method === "get" && complianceMatch) {
    return {
      operationName: "hostComplianceChecklist",
      query: `query HostComplianceChecklist($hotelId: ID!) { hostComplianceChecklist(hotelId: $hotelId) { id hotelId jurisdictionCode checklistItems { label completed } status createdAt updatedAt } }`,
      variables: { hotelId: complianceMatch[1] },
      transform: (result) => ({
        success: true,
        data: result
          ? {
              ...result,
              checklistItems: JSON.stringify(result.checklistItems || []),
            }
          : null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && complianceMatch) {
    return {
      operationName: "upsertHostComplianceChecklist",
      query: `mutation UpsertHostComplianceChecklist($hotelId: ID!, $input: ComplianceChecklistInput!) { upsertHostComplianceChecklist(hotelId: $hotelId, input: $input) { id hotelId jurisdictionCode checklistItems { label completed } status createdAt updatedAt } }`,
      variables: { hotelId: complianceMatch[1], input: body },
      transform: (result) => ({
        success: true,
        data: {
          ...result,
          checklistItems: JSON.stringify(result?.checklistItems || []),
        },
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/host/tools/claims") {
    return {
      operationName: "hostClaims",
      query: `query HostClaims { hostClaims { id hotelId bookingId hostUserId title description amountClaimed evidenceUrls status resolutionNote createdAt updatedAt } }`,
      transform: (result) => ({
        success: true,
        data: (result ?? []).map((claim: Record<string, any>) => ({
          ...claim,
          evidenceUrls: JSON.stringify(claim.evidenceUrls || []),
        })),
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/host/tools/claims") {
    return {
      operationName: "createHostClaim",
      query: `mutation CreateHostClaim($input: HostClaimInput!) { createHostClaim(input: $input) { id hotelId bookingId hostUserId title description amountClaimed evidenceUrls status resolutionNote createdAt updatedAt } }`,
      variables: { input: body },
      transform: (result) => ({
        success: true,
        data: {
          ...result,
          evidenceUrls: JSON.stringify(result?.evidenceUrls || []),
        },
        statusCode: 200,
      }),
    };
  }

  const listingQualityMatch = path.match(
    /^\/host\/tools\/hotels\/([^/]+)\/listing-quality$/,
  );
  if (method === "get" && listingQualityMatch) {
    return {
      operationName: "hostListingQuality",
      query: `query HostListingQuality($hotelId: ID!) { hostListingQuality(hotelId: $hotelId) { id hotelId coverImageUrl guidebook houseManual checkInSteps completenessScore createdAt updatedAt } }`,
      variables: { hotelId: listingQualityMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && listingQualityMatch) {
    return {
      operationName: "upsertHostListingQuality",
      query: `mutation UpsertHostListingQuality($hotelId: ID!, $input: ListingQualityInput!) { upsertHostListingQuality(hotelId: $hotelId, input: $input) { id hotelId coverImageUrl guidebook houseManual checkInSteps completenessScore createdAt updatedAt } }`,
      variables: { hotelId: listingQualityMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "get" && path === "/hotels/search") {
    const latitude = asFiniteNumber(params.latitude, DEFAULT_SEARCH_LAT);
    const longitude = asFiniteNumber(params.longitude, DEFAULT_SEARCH_LNG);

    return {
      operationName: "searchHotels",
      query: `query SearchHotels($input: SearchHotelsInput!) { searchHotels(input: $input) { data { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt owner { id name avatar superhost responseRate } rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } page limit total pages } }`,
      variables: {
        input: {
          latitude,
          longitude,
          radiusKm:
            asFiniteNumber(params.radiusKm),
          checkIn: toIsoDateTime(params.checkIn),
          checkOut: toIsoDateTime(params.checkOut),
          guests:
            asFiniteNumber(params.guests),
          minPrice:
            asFiniteNumber(params.minPrice),
          maxPrice:
            asFiniteNumber(params.maxPrice),
          instantBooking:
            typeof params.instantBooking === "boolean"
              ? params.instantBooking
              : undefined,
          minRating:
            asFiniteNumber(params.minRating),
          accessibility: params.accessibility,
          north: asFiniteNumber(params.north),
          south: asFiniteNumber(params.south),
          east: asFiniteNumber(params.east),
          west: asFiniteNumber(params.west),
          sortBy: params.sortBy,
          page,
          limit,
        },
      },
      transform: (result) => ({
        data: result?.data ?? [],
        total: Number(result?.total || 0),
        page: Number(result?.page || page),
        limit: Number(result?.limit || limit),
        hasMore: Number(result?.page || page) < Number(result?.pages || 0),
      }),
    };
  }

  if (method === "get" && path === "/hotels/promoted") {
    return {
      operationName: "promotedHotels",
      query: `query PromotedHotels { promotedHotels { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt owner { id name avatar superhost responseRate } rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "get" && path === "/hotels/my") {
    return {
      operationName: "myHotels",
      query: `query MyHotels { myHotels { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && path === "/hotels") {
    return {
      operationName: "createHotel",
      query: `mutation CreateHotel($input: CreateHotelInput!) { createHotel(input: $input) { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt owner { id name avatar superhost responseRate } rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      variables: { input: body },
      transform: (result) => result,
    };
  }

  const promoteHotelMatch = path.match(/^\/hotels\/([^/]+)\/promote$/);
  if (method === "post" && promoteHotelMatch) {
    return {
      operationName: "promoteHotel",
      query: `mutation PromoteHotel($hotelId: ID!, $durationDays: Int) { promoteHotel(hotelId: $hotelId, durationDays: $durationDays) { id name isPromoted promotedUntil } }`,
      variables: {
        hotelId: promoteHotelMatch[1],
        durationDays: body.durationDays,
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "delete" && promoteHotelMatch) {
    return {
      operationName: "unpromoteHotel",
      query: `mutation UnpromoteHotel($hotelId: ID!) { unpromoteHotel(hotelId: $hotelId) { id name isPromoted promotedUntil } }`,
      variables: { hotelId: promoteHotelMatch[1] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const blockedDatesMatch = path.match(/^\/hotels\/([^/]+)\/block-dates$/);
  if (method === "get" && blockedDatesMatch) {
    return {
      operationName: "hotelBlockedDates",
      query: `query HotelBlockedDates($hotelId: ID!) { hotelBlockedDates(hotelId: $hotelId) { id hotelId roomId startDate endDate reason createdAt updatedAt } }`,
      variables: { hotelId: blockedDatesMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && blockedDatesMatch) {
    return {
      operationName: "blockHotelDates",
      query: `mutation BlockHotelDates($hotelId: ID!, $input: BlockDatesInput!) { blockHotelDates(hotelId: $hotelId, input: $input) { id hotelId roomId startDate endDate reason createdAt updatedAt } }`,
      variables: {
        hotelId: blockedDatesMatch[1],
        input: {
          startDate: toIsoDateTime(body.startDate),
          endDate: toIsoDateTime(body.endDate),
          reason: body.reason,
        },
      },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  const calendarRulesMatch = path.match(/^\/hotels\/([^/]+)\/calendar-rules$/);
  if (method === "get" && calendarRulesMatch) {
    return {
      operationName: "hotelCalendarRules",
      query: `query HotelCalendarRules($hotelId: ID!) { hotelCalendarRules(hotelId: $hotelId) { id hotelId minStayNights maxStayNights advanceNoticeHours prepTimeHours allowSameDayCheckIn checkInStartTime checkInEndTime createdAt updatedAt } }`,
      variables: { hotelId: calendarRulesMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && calendarRulesMatch) {
    return {
      operationName: "upsertHotelCalendarRules",
      query: `mutation UpsertHotelCalendarRules($hotelId: ID!, $input: HotelCalendarRulesInput!) { upsertHotelCalendarRules(hotelId: $hotelId, input: $input) { id hotelId minStayNights maxStayNights advanceNoticeHours prepTimeHours allowSameDayCheckIn checkInStartTime checkInEndTime createdAt updatedAt } }`,
      variables: { hotelId: calendarRulesMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const icalSourcesMatch = path.match(/^\/hotels\/([^/]+)\/ical\/sources$/);
  if (method === "get" && icalSourcesMatch) {
    return {
      operationName: "hotelIcalSources",
      query: `query HotelIcalSources($hotelId: ID!) { hotelIcalSources(hotelId: $hotelId) { id hotelId name url enabled lastSyncedAt createdAt updatedAt } }`,
      variables: { hotelId: icalSourcesMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && icalSourcesMatch) {
    return {
      operationName: "createHotelIcalSource",
      query: `mutation CreateHotelIcalSource($hotelId: ID!, $input: HotelIcalSourceInput!) { createHotelIcalSource(hotelId: $hotelId, input: $input) { id hotelId name url enabled lastSyncedAt createdAt updatedAt } }`,
      variables: { hotelId: icalSourcesMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const deleteIcalSourceMatch = path.match(
    /^\/hotels\/([^/]+)\/ical\/sources\/([^/]+)$/,
  );
  if (method === "delete" && deleteIcalSourceMatch) {
    return {
      operationName: "deleteHotelIcalSource",
      query: `mutation DeleteHotelIcalSource($hotelId: ID!, $sourceId: ID!) { deleteHotelIcalSource(hotelId: $hotelId, sourceId: $sourceId) { deleted message } }`,
      variables: {
        hotelId: deleteIcalSourceMatch[1],
        sourceId: deleteIcalSourceMatch[2],
      },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  const syncIcalSourceMatch = path.match(
    /^\/hotels\/([^/]+)\/ical\/sources\/([^/]+)\/sync$/,
  );
  if (method === "post" && syncIcalSourceMatch) {
    return {
      operationName: "syncHotelIcalSource",
      query: `mutation SyncHotelIcalSource($hotelId: ID!, $sourceId: ID!) { syncHotelIcalSource(hotelId: $hotelId, sourceId: $sourceId) { eventsParsed blockedDatesCreated } }`,
      variables: {
        hotelId: syncIcalSourceMatch[1],
        sourceId: syncIcalSourceMatch[2],
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const importIcalMatch = path.match(/^\/hotels\/([^/]+)\/ical\/import$/);
  if (method === "post" && importIcalMatch) {
    return {
      operationName: "importHotelIcal",
      query: `mutation ImportHotelIcal($hotelId: ID!, $input: HotelIcalImportInput!) { importHotelIcal(hotelId: $hotelId, input: $input) { eventsParsed blockedDatesCreated } }`,
      variables: { hotelId: importIcalMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const pricingRulesMatch = path.match(/^\/hotels\/([^/]+)\/pricing-rules$/);
  if (method === "get" && pricingRulesMatch) {
    return {
      operationName: "hotelPricingRules",
      query: `query HotelPricingRules($hotelId: ID!) { hotelPricingRules(hotelId: $hotelId) { id hotelId weekdayMultiplier weekendMultiplier weeklyDiscountPercent monthlyDiscountPercent earlyBirdDiscountPercent lastMinuteDiscountPercent cleaningFee createdAt updatedAt } }`,
      variables: { hotelId: pricingRulesMatch[1] },
      transform: (result) => ({
        success: true,
        data: result ?? null,
        statusCode: 200,
      }),
    };
  }

  if (method === "put" && pricingRulesMatch) {
    return {
      operationName: "upsertHotelPricingRules",
      query: `mutation UpsertHotelPricingRules($hotelId: ID!, $input: HotelPricingRulesInput!) { upsertHotelPricingRules(hotelId: $hotelId, input: $input) { id hotelId weekdayMultiplier weekendMultiplier weeklyDiscountPercent monthlyDiscountPercent earlyBirdDiscountPercent lastMinuteDiscountPercent cleaningFee createdAt updatedAt } }`,
      variables: { hotelId: pricingRulesMatch[1], input: body },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hotelRoomsMatch = path.match(/^\/hotels\/([^/]+)\/rooms$/);
  if (method === "get" && hotelRoomsMatch) {
    return {
      operationName: "hotelById",
      query: `query HotelRooms($id: ID!) { hotelById(id: $id) { id rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      variables: { id: hotelRoomsMatch[1] },
      transform: (result) => ({
        success: true,
        data: result?.rooms ?? [],
        statusCode: 200,
      }),
    };
  }

  if (method === "post" && hotelRoomsMatch) {
    return {
      operationName: "createRoom",
      query: `mutation CreateRoom($hotelId: ID!, $input: CreateRoomInput!) { createRoom(hotelId: $hotelId, input: $input) { id hotelId roomType capacity maxGuests basePrice isAvailable amenities images createdAt updatedAt } }`,
      variables: {
        hotelId: hotelRoomsMatch[1],
        input: {
          roomType: body.roomType,
          capacity: Number(body.capacity ?? body.maxGuests ?? 1),
          maxGuests: Number(body.maxGuests ?? body.capacity ?? 1),
          basePrice: Number(body.basePrice),
          amenities: body.amenities,
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  const hotelRoomMatch = path.match(/^\/hotels\/([^/]+)\/rooms\/([^/]+)$/);
  if (method === "get" && hotelRoomMatch) {
    return {
      operationName: "roomById",
      query: `query RoomById($roomId: ID!) { roomById(roomId: $roomId) { id hotelId roomType capacity maxGuests basePrice isAvailable amenities images createdAt updatedAt hotel { id name location } } }`,
      variables: { roomId: hotelRoomMatch[2] },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "patch" && hotelRoomMatch) {
    return {
      operationName: "updateRoom",
      query: `mutation UpdateRoom($roomId: ID!, $input: UpdateRoomInput!) { updateRoom(roomId: $roomId, input: $input) { id hotelId roomType capacity maxGuests basePrice isAvailable amenities images createdAt updatedAt } }`,
      variables: {
        roomId: hotelRoomMatch[2],
        input: {
          ...body,
          capacity:
            body.capacity !== undefined
              ? Number(body.capacity)
              : body.maxGuests !== undefined
                ? Number(body.maxGuests)
                : undefined,
          maxGuests:
            body.maxGuests !== undefined
              ? Number(body.maxGuests)
              : body.capacity !== undefined
                ? Number(body.capacity)
                : undefined,
          basePrice:
            body.basePrice !== undefined ? Number(body.basePrice) : undefined,
        },
      },
      transform: (result) => ({ success: true, data: result, statusCode: 200 }),
    };
  }

  if (method === "delete" && hotelRoomMatch) {
    return {
      operationName: "deleteRoom",
      query: `mutation DeleteRoom($roomId: ID!) { deleteRoom(roomId: $roomId) { deleted message } }`,
      variables: { roomId: hotelRoomMatch[2] },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  const hotelByIdMatch = path.match(/^\/hotels\/([^/]+)$/);
  if (method === "get" && hotelByIdMatch) {
    return {
      operationName: "hotelById",
      query: `query HotelById($id: ID!) { hotelById(id: $id) { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt owner { id name avatar superhost responseRate } rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      variables: { id: hotelByIdMatch[1] },
      transform: (result) => result,
    };
  }

  if (method === "put" && hotelByIdMatch) {
    return {
      operationName: "updateHotel",
      query: `mutation UpdateHotel($hotelId: ID!, $input: UpdateHotelInput!) { updateHotel(hotelId: $hotelId, input: $input) { id ownerId name description location amenities publicRules checkInTime checkOutTime instantBooking isPromoted promotedUntil createdAt updatedAt owner { id name avatar superhost responseRate } rooms { id roomType capacity maxGuests basePrice isAvailable amenities images } } }`,
      variables: { hotelId: hotelByIdMatch[1], input: body },
      transform: (result) => result,
    };
  }

  if (method === "delete" && hotelByIdMatch) {
    return {
      operationName: "deleteHotel",
      query: `mutation DeleteHotel($hotelId: ID!) { deleteHotel(hotelId: $hotelId) { deleted message } }`,
      variables: { hotelId: hotelByIdMatch[1] },
      transform: (result) => ({
        success: Boolean(result?.deleted),
        data: result,
        statusCode: 200,
      }),
    };
  }

  return null;
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = String(config.method || "get").toLowerCase();
    const path = toPath(config.url);
    const params = (config.params || {}) as Record<string, any>;
    const body = (config.data || {}) as Record<string, any>;

    const adapter = buildAdapterConfig(method, path, params, body);
    if (!adapter) {
      return config;
    }

    (config as any).__gqlOperationName = adapter.operationName;
    (config as any).__gqlTransform = adapter.transform;

    config.url = "/graphql";
    config.method = "post";
    config.params = undefined;
    config.data = toGraphqlPayload(adapter);

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    const operationName = (response.config as any).__gqlOperationName;
    const transform = (response.config as any).__gqlTransform as
      | ((result: any) => any)
      | undefined;

    if (!operationName || !transform) {
      return response;
    }

    const payload = response.data || {};
    const errors = payload.errors as Array<Record<string, any>> | undefined;
    if (errors && errors.length > 0) {
      const first = errors[0] || {};
      const code = first.extensions?.code;
      const status =
        code === "UNAUTHENTICATED" || /auth/i.test(String(first.message || ""))
          ? 401
          : 400;

      const error = new Error(
        String(first.message || "Request failed"),
      ) as Error & {
        response?: {
          status: number;
          data: {
            error: { message: string; code?: string; details?: unknown };
          };
        };
      };
      error.response = {
        status,
        data: {
          error: {
            message: String(first.message || "Request failed"),
            code,
            details: errors,
          },
        },
      };
      throw error;
    }

    const result = payload?.data?.[operationName];
    response.data = transform(result);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;

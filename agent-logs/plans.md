# Airbnb Clone - Development Plan
> Last updated: March 11, 2026 — Reflects actual implemented architecture

## 1. System Architecture

### Microservice Workspace Structure (pnpm workspaces)
```
my-bnb/
├── backend/                    # ✅ Express API (TypeScript, Prisma 7, Razorpay)
│   ├── src/
│   │   ├── config/             # DB (pg pool + PrismaPg adapter), Redis, MinIO, env
│   │   ├── middleware/         # auth (JWT), errorHandler, requestLogger, setup
│   │   ├── routes/             # 13 route files (auth, hotels, rooms, bookings…)
│   │   ├── services/           # 13 service files (business logic layer)
│   │   └── utils/              # catchAsync, appError, response, crudFactory, jwt, eventPublisher
│   ├── prisma/
│   │   └── schema.prisma       # 20 models, Prisma 7 (no url in datasource)
│   └── infra/
│       └── docker/
│           └── docker-compose.yml  # postgres, redis, minio + microservices
├── services/
│   ├── notification/           # ✅ Redis sub → Gmail SMTP + in-app DB writes
│   │   ├── src/
│   │   │   ├── subscriber.ts   # Listens on app:events channel
│   │   │   ├── handlers/       # 14 event handlers
│   │   │   ├── services/       # emailService (nodemailer), inAppService (Prisma)
│   │   │   ├── templates/      # 5 HTML email templates
│   │   │   └── config/         # mailer (Gmail SMTP), database, redis
│   │   └── prisma/             # Full schema copy (Prisma 7)
│   └── job-supervisor/         # ✅ node-cron scheduler + Redis publisher
│       ├── src/
│       │   ├── cronManager.ts  # Schedules & orchestrates all CRON jobs
│       │   ├── jobs/           # 5 CRON jobs (expiry, reminder, cleaning, superhost, escalation)
│       │   └── config/         # database, redis, eventPublisher
│       └── prisma/             # Full schema copy (Prisma 7)
├── frontend/                   # ⏳ Next.js (not yet started)
└── agent-logs/                 # Development tracking
```

### Event Bus Architecture
```
backend (Express)
    └─ publishEvent() → Redis PUBLISH app:events → notification-service subscriber
                                                 → (future: other consumers)

job-supervisor
    └─ publishEvent() → Redis PUBLISH app:events → notification-service subscriber
```

### Inter-Service Communication
- **Transport**: Redis Pub/Sub on channel `app:events`
- **Pattern**: Fire-and-forget (no response required)
- **Payload**: JSON `{ event: string, data: object, timestamp: ISO }`
- **14 event types**: booking.created/confirmed/cancelled/checked_in/checked_out/expired, payment.success/failed, message.new, review.created, checkin.reminder, checkout.reminder, superhost.updated, incident.escalated

## 2. Database Schema (Prisma ORM v7)

### Core Models
- **User** (id, email, password, name, avatar, role, superhost, responseRate, document, verified)
- **UserDocument** (id, userId, documentType, docUrl, status) *(ID verification)*
- **Hotel** (id, ownerId, name, location, amenities, description, publicRules, checkInTime, checkOutTime, instantBooking)
- **Room** (id, hotelId, roomType, capacity, basePrice, amenities, images, maxGuests)
- **Booking** (id, userId, roomId, checkIn, checkOut, status, amount, guestCount, cancellationPolicy, notes)
- **BookingHistory** (id, bookingId, status, changedAt, updatedBy) *(Audit trail)*
- **CancellationPolicy** (id, name, type, refundPercentage, description) *(flexible, moderate, strict)*
- **Review** (id, senderId, receiverId, bookingId, rating, comment, categories) *(bidirectional)*
- **Payment** (id, bookingId, razorpayOrderId, amount, tax, serviceFee, status, createdAt)
- **RoomAvailability** (id, roomId, date, isAvailable, blockedReason)
- **BlockedDates** (id, roomId, startDate, endDate, reason) *(Host blocks dates)*
- **Wishlist** (id, userId, roomId, addedAt)
- **Message** (id, senderUserId, receiverUserId, bookingId, content, createdAt, read)
- **Notification** (id, userId, type, content, link, read, createdAt)
- **IncidentReport** (id, bookingId, reportedByUserId, description, status, resolvedAt)
- **SupportTicket** (id, userId, subject, description, status, priority, createdAt)
- **SearchHistory** (id, userId, queryLocation, checkIn, checkOut, guests, createdAt) *(For personalization)*
- **HostVerification** (id, userId, accountAge, bookingsCompleted, avgRating, status) *(Superhost logic)*
- **ServiceFeeConfig** (id, percentage, cap, description) *(Platform fees)*
- **TaxConfiguration** (id, country/region, taxPercentage, description)

### Relationships
- User → Hotel (1:N owner)
- User → Booking (1:N guest)
- User → Review (1:N sent & received)
- User → Message (1:N sender/receiver)
- User → Wishlist (1:N)
- Hotel → Room (1:N)
- Hotel → HostVerification (1:1)
- Room → Booking (1:N)
- Room → BlockedDates (1:N)
- Room → RoomAvailability (1:N)
- Booking → Payment (1:1)
- Booking → Review (1:N)
- Booking → Message (1:N)
- Booking → IncidentReport (1:N)

## 3. API Structure (Express)

### Key Endpoints
```
/api/auth/
  POST /register
  POST /login
  POST /logout
  POST /refresh-token
  GET /me (current user)
  POST /verify-email

/api/users/
  GET /:id/profile
  PUT /:id/profile
  POST /:id/verify-document (ID upload)
  GET /:id/documents
  DELETE /:id/documents/:docId
  GET /:id/host-verification (Superhost status)

/api/hotels/
  GET /search?lat=X&lng=Y&radius=10&checkIn=DATE&checkOut=DATE&guests=N
  GET /:id (with amenities, rules, reviews)
  GET /:id/rooms
  GET /:id/reviews
  POST / (owner only)
  PUT /:id (owner only)
  DELETE /:id (owner only)
  POST /:id/block-dates (host blocks dates)
  GET /:id/block-dates

/api/rooms/
  GET /:id (full details with amenities)
  GET /:id/available?checkIn=DATE&checkOut=DATE
  POST /:id/images (MinIO upload)
  GET /:id/pricing?checkIn=DATE&checkOut=DATE (with taxes, fees)
  DELETE /:id/images/:imageId

/api/bookings/
  POST / (create booking with guestCount, cancellationPolicy)
  GET / (user's bookings with filters)
  GET /:id (booking details)
  PATCH /:id/cancel (with refund calculation)
  POST /:id/confirm-checkin
  POST /:id/confirm-checkout
  PATCH /:id/update (modify guest count, dates)

/api/reviews/
  POST / (create review for booking)
  GET /booking/:bookingId (get review for booking)
  PUT /:id (update review)
  DELETE /:id (delete review)

/api/messages/
  POST / (send message)
  GET /thread/:userId (conversation with user)
  GET /conversations (all conversations)
  PATCH /:id/read (mark as read)
  GET /unread-count

/api/wishlists/
  POST / (add room to wishlist)
  GET / (user's wishlist)
  DELETE /:roomId (remove from wishlist)

/api/payments/
  POST / (initialize Razorpay order)
  POST /webhook (Razorpay callback)
  GET /:id
  GET /booking/:bookingId (payment details with breakdown)

/api/notifications/
  GET / (user notifications)
  PATCH /:id/read
  DELETE /:id
  
/api/support/
  POST /tickets (create support ticket)
  GET /tickets (user's tickets)
  GET /tickets/:id (ticket details)
  POST /tickets/:id/reply (customer reply)

/api/search-history/
  POST / (save search)
  GET / (user's search history)
  DELETE / (clear history)

/api/reports/
  POST /incident (report incident)
  GET /:id (incident details - user only or admin)
  PATCH /:id/resolve (admin action)
```

## 4. Concurrency & Booking Strategy

### Redis Lock Mechanism
```
Lock Key: booking:room:{roomId}:{checkInDate}:{checkOutDate}

Flow:
1. Client requests booking
2. API acquires Redis lock (TTL: 5 seconds)
3. Check room availability in DB
4. Reserve room in DB transaction
5. Create booking record
6. Release lock
7. Return booking confirmation
```

### Booking States
- `PENDING` → `CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT`
- `PENDING` → `CANCELLED`
- `PENDING` → `EXPIRED` (if timeout)

### Booking Expiration
- Booking remains PENDING for 10 minutes
- If not paid within 10 min, auto-cancel using Redis TTL + job queue
- Job worker checks expired bookings and updates status

## 5. Image Storage (MinIO)

### Bucket Structure
```
room-images/
  {hotelId}/{roomId}/{timestamp}_{fileName}

hotel-images/
  {hotelId}/cover_{timestamp}
  {hotelId}/gallery_{timestamp}

user-avatars/
  {userId}_{timestamp}
```

### Upload Flow
1. Client calls `GET /api/rooms/:id/images/presigned-url`
2. Backend generates MinIO signed URL (expires in 1 hour)
3. Client uploads directly to MinIO
4. Webhook/callback updates DB with image record
5. Database stores: bucket, objectKey, publicUrl

### Retrieval
- Database returns URLs directly
- MinIO serves images with CDN caching

## 6. Payment Integration (Razorpay)

### Flow
```
1. User clicks "Confirm Booking"
2. Backend creates Razorpay Order
   - Amount in paise (INR * 100)
   - Include bookingId as receipt
3. Frontend opens Razorpay Checkout modal
4. User enters card/wallet/UPI details
5. Razorpay redirects to webhook
6. Backend verifies signature
7. Update Payment record (SUCCESS/FAILED)
8. Update Booking status to CONFIRMED
9. Send confirmation email
```

### Tables
- **Payment**: id, bookingId, razorpayOrderId, razorpayPaymentId, status, amount, createdAt

## 7. Background Jobs — job-supervisor Microservice ✅

### Architecture
Separate `services/job-supervisor/` process. Uses `node-cron` for scheduling, Prisma for DB access, and Redis pub/sub to publish events to the notification service.

```
services/job-supervisor/
├── src/
│   ├── index.ts            # Entry — connects DB + Redis, starts CronManager
│   ├── cronManager.ts      # Schedules all 5 jobs
│   ├── jobs/
│   │   ├── bookingExpiry.job.ts        # Every 5 min
│   │   ├── checkoutReminder.job.ts     # Every hour
│   │   ├── roomCleaning.job.ts         # Every 30 min
│   │   ├── superhostCalc.job.ts        # Daily 2 AM
│   │   └── incidentEscalation.job.ts   # Every 4 hours
│   └── config/
│       ├── database.ts     # PrismaClient
│       ├── redis.ts        # Redis client
│       └── eventPublisher.ts  # publishEvent() → app:events channel
└── prisma/
    └── schema.prisma       # Full schema copy (Prisma 7, prisma.config.ts)
```

### CRON Jobs

**Job 1: Booking Expiration** (Every 5 min — `*/5 * * * *`)
- Finds PENDING bookings past `expiresAt`
- Marks them `expired`, creates BookingHistory record
- Publishes `booking.expired` event → notification service emails guest

**Job 2: Checkout Reminder** (Every 1 hour — `0 * * * *`)
- Finds confirmed bookings checking in tomorrow → publishes `checkin.reminder`
- Finds checked-in bookings checking out tomorrow → publishes `checkout.reminder`

**Job 3: Room Cleaning** (Every 30 min — `*/30 * * * *`)
- Logs rooms checked out 2+ hours ago that may need cleaning (advisory, no event)

**Job 4: Superhost Calculator** (Daily 2 AM — `0 2 * * *`)
- Recalculates host metrics: rating ≥4.8, response ≥90%, cancellation <1%, ≥10 bookings, account ≥1 yr
- Upserts `HostVerification` records
- Publishes `superhost.updated` when status changes

**Job 5: Incident Escalation** (Every 4 hours — `0 */4 * * *`)
- Finds `open` incidents older than 48 hours
- Marks as `investigating`
- Publishes `incident.escalated`

## 8. Cancellation Policies & Refund Logic

### Policy Types
- **Flexible**: Full refund up to 24 hours before check-in
- **Moderate**: 50% refund up to 3 days before check-in  
- **Strict**: No refund after 2 days of booking confirmation

### Refund Calculation
```
Total Amount = Base Price + Service Fee + Tax

On Cancellation:
- Calculate refund percentage from policy
- Deduct Razorpay processing fees (2%)
- Update Payment status to REFUNDED
- Process refund via Razorpay API
- Send refund notification
- Update Booking status to CANCELLED
```

## 9. Service & Tax Calculations

### Payment Breakdown
```
Subtotal = (nightly_rate × nights) + cleaning_fee

Service Fee = Subtotal × service_fee_percentage (cap: 30%)

Taxes = (Subtotal + Service Fee) × tax_rate

Total = Subtotal + Service Fee + Taxes

Example (₹5000/night, 2 nights):
- Subtotal: ₹10,000
- Service Fee (13%): ₹1,300
- Taxes (5%): ₹570
- TOTAL: ₹11,870
```

### Pricing Strategy (Host Options)
- Base price per night
- Cleaning fee (optional)
- Seasonal multipliers
- Instant booking discount
- Weekly/monthly discounts

## 10. Host Verification & Trust System

### Verification Checklist
1. **Email Verification** - Required to post listings
2. **Phone Verification** - SMS code (optional for now)
3. **Government ID** - Uploaded document with basic validation
4. **Address Verification** - Matched with user profile

### Superhost Requirements
- **Rating**: Minimum 4.8/5.0
- **Response Rate**: 90%+ within 24 hours
- **Booking Completion**: Completion rate > 95%
- **Cancellation Rate**: < 1% (host cancellations)
- **Account Age**: Minimum 1 year
- **Minimum Bookings**: 10+ completed

### Superhost Benefits
- Boost in search rankings
- Badge displayed on profile
- Priority support access

## 11. Reviews & Ratings System

### Bidirectional Reviews
- Guest reviews property & host
- Host reviews guest (behavior, cleanliness)

### Review Categories
- Cleanliness
- Communication
- Accuracy (matches listing)
- Location
- Check-in
- Value
- Overall Rating (1-5 stars)

### Review Timeline
- Can only review after checkout
- Can review for 30 days after booking
- Cannot modify review after 7 days
- Host response to reviews (optional text)

## 12. Messaging & Communication

### Real-time Chat
- Guest can message before booking (if enabled)
- After booking: full bidirectional messaging
- Notifications for new messages
- Message history linked to booking

### Auto-response Templates
- Host can setup auto-replies
- Welcome message on booking
- Check-in instructions
- Check-out reminders

## 13. Search & Discovery Features

### Advanced Filtering
```
Search Parameters:
- Location (map selection or autocomplete)
- Check-in / Check-out dates
- Number of guests
- Property type (apartment, house, villa, etc.)
- Price range (min-max)
- Room type (private room, shared, entire place)
- Amenities (WiFi, Pool, Kitchen, Hot Tub, Gym, etc.)
- Room amenities (AC, TV, Heater, Washer, etc.)
- Host rating (4.8+, 4.5+, etc.)
- Instant booking only
- Superhost only
- Sort: price (asc/desc), rating, newest, reviews
```

### Search Optimization
- Save searches to account
- Search history for recommendations
- Similar properties suggestions
- Trending locations

## 14. Notifications System ✅

### Architecture: notification-service Microservice
Separate `services/notification/` process. Subscribes to Redis `app:events`, writes in-app DB records via Prisma, and sends emails via Gmail SMTP (nodemailer).

```
services/notification/
├── src/
│   ├── index.ts                     # Entry — connects DB + mailer + Redis subscriber
│   ├── subscriber.ts                # Redis SUBSCRIBE app:events → routes to handlers
│   ├── handlers/
│   │   └── eventHandlers.ts         # 14 handlers (one per event type)
│   ├── services/
│   │   ├── emailService.ts          # sendEmail() via nodemailer/Gmail SMTP
│   │   └── inAppService.ts          # createInAppNotification(), createBulkInAppNotifications()
│   ├── templates/                   # HTML email templates
│   │   ├── booking.template.ts
│   │   ├── payment.template.ts
│   │   ├── message.template.ts
│   │   ├── reminder.template.ts
│   │   └── system.template.ts
│   └── config/
│       ├── mailer.ts                # Gmail SMTP: host smtp.gmail.com, port 587
│       ├── database.ts              # PrismaClient
│       └── redis.ts                 # Redis client (SUBSCRIBE mode)
└── prisma/
    └── schema.prisma                # Full schema copy (Prisma 7, prisma.config.ts)
```

### Notification Types Handled

| Event | In-App | Email | Recipients |
|-------|--------|-------|-----------|
| booking.created | ✅ | ✅ | guest + host |
| booking.confirmed | ✅ | ✅ | guest |
| booking.cancelled | ✅ | ✅ | guest + host |
| booking.checked_in | ✅ | ✅ | guest |
| booking.checked_out | ✅ | ✅ | guest |
| booking.expired | ✅ | ✅ | guest |
| payment.success | ✅ | ✅ | guest |
| payment.failed | ✅ | ✅ | guest |
| message.new | ✅ | ✅ | receiver |
| review.created | ✅ | ✅ | reviewed user |
| checkin.reminder | ✅ | ✅ | guest |
| checkout.reminder | ✅ | ✅ | guest |
| superhost.updated | ✅ | ✅ | host |
| incident.escalated | ✅ | ✅ | reporter |

### API Endpoints (in-app notifications)
```
GET  /api/notifications        — list for current user
PATCH /api/notifications/:id/read — mark read
DELETE /api/notifications/:id  — delete
```

### Email Credentials
Gmail SMTP credentials provided by user and set via environment variables:
- `SMTP_USER` — Gmail address
- `SMTP_PASS` — App password (not account password)

## 15. Incident & Dispute Resolution

### Incident Types
- Damage to property
- Cleanliness issues
- Missing amenities
- Guest behavior violations
- Payment disputes

### Resolution Flow
```
1. Either party reports incident within 72 hours
2. System creates IncidentReport
3. Messages exchanged between parties via support system
4. Airbnb-like team reviews (admin action)
5. Decision: Refund, compensation, or close
6. Update payment/booking accordingly
```

## 16. Wishlist & Personalization

### Wishlist Features
- Add/remove rooms to wishlist
- Access from profile
- Price alerts on wishlist items

### Personalization
- Recommend based on search history
- Similar property suggestions
- Trending areas

## 17. Frontend Architecture (Next.js)

### Pages Structure
```
pages/
  /                    # Homepage with map search
  /search              # Search results
  /room/[id]          # Room detail & booking
  /bookings            # User's bookings
  /account             # User profile
  /admin/              # Host dashboard (owner only)
  /payment/success
  /payment/failed
```

### State Management (Zustand)
```
userStore
  - user data
  - auth status
  - logout handler

searchStore
  - search filters (location, dates, guests)
  - results
  - map center

bookingStore
  - current booking in progress
  - booking list
```

### Key Components
- MapSearch (Leaflet/Mapbox)
- RoomCard
- RoomDetail
- BookingForm
- PaymentModal
- Calendar availability

## 18. Deployment Strategy

### Frontend (Vercel)
- Environment: Production, Preview, Development
- Auto-deploy from main branch
- Environment variables for API endpoint

### Backend (Docker)
- Node.js 20 Alpine image
- Express server with Helmet, compression
- Environment: production, staging, development
- Deployed to cloud (AWS ECS, Railway, or Heroku)

### Database (Managed PostgreSQL)
- Managed service (AWS RDS, Supabase, or Railway)
- Automated backups
- Connection pooling with PgBouncer

### Storage (MinIO)
- Docker container or managed S3-compatible service
- Bucket configuration & security policies
- CDN in front (CloudFlare or CDN service)

### Redis
- Docker container or managed Redis (AWS ElastiCache)
- Persistence enabled (RDB/AOF)
- Keyspace notifications for TTL events

## 19. Development Workflow

### Phase 1: Project Setup ✅ COMPLETE
- [x] Create workspace with pnpm workspaces
- [x] Setup TypeScript configs (backend, notification, job-supervisor)
- [x] Create database schema (Prisma 7, 20 models)
- [x] Docker environment (PostgreSQL, Redis, MinIO, microservices)

### Phase 2: Core Backend ✅ COMPLETE
- [x] Express server setup with middleware (helmet, cors, morgan, compression)
- [x] Auth system (JWT, bcrypt, register/login/logout/refresh/verify-email)
- [x] Hotel & room endpoints (CRUD + block-dates + presigned-url + pricing)
- [x] Booking logic (create with Redis lock, cancel, update, check-in, check-out)
- [x] All 13 route modules registered and working
- [x] All 13 service modules with full business logic

### Phase 3: Payment & Concurrency ✅ COMPLETE
- [x] Redis integration (connection pooling, pub/sub)
- [x] Booking Redis lock mechanism (5s TTL, with race-condition prevention)
- [x] Razorpay integration (order creation, webhook with raw-body HMAC, refunds)
- [x] Booking expiration (10-min timer via job-supervisor CRON)
- [x] Event publishing (fire-and-forget via eventPublisher utility)

### Phase 4: Image Storage ✅ COMPLETE
- [x] MinIO integration (bucket creation via init script)
- [x] Presigned URL endpoint (GET /api/rooms/:id/images/presigned-url)
- [x] Direct upload endpoint (POST /api/rooms/:id/images)
- [x] Image delete endpoint (DELETE /api/rooms/:id/images/:imageKey)

### Phase 4b: Microservices ✅ COMPLETE
- [x] notification-service (Redis sub, Gmail SMTP, in-app DB, 14 event handlers)
- [x] job-supervisor (5 CRON jobs, Redis pub, Prisma)
- [x] Redis event bus wired into backend (booking, payment, message, review services)
- [x] Docker Compose updated with both service containers
- [x] prisma.config.ts for Prisma 7 in both services

### Phase 4c: Bug Fixes (March 11, 2026) ✅ COMPLETE
- [x] Fix dead-code publishEvent in booking.service.ts (was after finally block)
- [x] Fix Razorpay webhook HMAC (rawBody captured via express.json verify callback)
- [x] Fix review route ordering (GET /booking/:bookingId now before GET /:id)
- [x] Fix payment route ordering (GET /booking/:bookingId now before GET /:id)
- [x] Add requireRole(['host','admin']) to PATCH /api/reports/:id/resolve
- [x] Add GET /api/bookings/host route + getHostBookings() service method

### Phase 5: Frontend Core ⏳ NOT STARTED
- [ ] Next.js setup with TypeScript + Tailwind
- [ ] Auth pages (login, register, logout)
- [ ] Hotel search page (map integration)
- [ ] Room listing / detail pages

### Phase 6: Booking & Payment UI ⏳ NOT STARTED
- [ ] Booking form & availability calendar
- [ ] Razorpay checkout modal
- [ ] Payment success/failed pages
- [ ] Booking confirmation & history pages

### Phase 7: Advanced Frontend Features ⏳ NOT STARTED
- [ ] Reviews & ratings UI
- [ ] Host dashboard (analytics, room management, incoming bookings)
- [ ] Messaging UI (thread view)
- [ ] Notification centre
- [ ] Wishlist UI

### Phase 8: Deployment & Testing ⏳ NOT STARTED
- [ ] Unit tests (Jest — backend services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (Playwright)
- [ ] Docker production configs
- [ ] Vercel deployment for frontend
- [ ] Performance optimisation

---

## Known Gaps / Future Work

| Item | Priority | Notes |
|------|----------|-------|
| `CancellationPolicy` model — not wired | Medium | Schema exists; booking uses hardcoded `"moderate"` string |
| `RoomAvailability` model — orphaned | Low | Availability via `Booking`+`BlockedDates` instead |
| Admin routes for `ServiceFeeConfig` / `TaxConfiguration` | Medium | Read in booking calc but no management endpoints |
| `UserDocument.status` update flow | Medium | No admin document-review endpoint |
| `HostVerification` admin override | Low | Job updates automatically; no manual override route |
| Seasonal pricing / weekly discounts | Low | Flat nightly rate only for now |
| Real-time chat (WebSocket) | Medium | REST messaging works; no socket connection |
| Admin panel endpoints | High | No `/api/admin/*` routes yet |
| Frontend | High | Phase 5–8 not started |

---

**Backend Status: COMPLETE ✅**  
**Microservices: COMPLETE ✅**  
**Frontend: NOT STARTED ⏳**

**Ready to proceed?** Please confirm this plan or request modifications.

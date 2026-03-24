# Development Tasks - Airbnb Clone
> Last updated: March 11, 2026

## Phase 1 — Project Setup ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| Create workspace with pnpm workspaces | ✅ Done | `d:\my-bnb` root workspace |
| Setup TypeScript configs | ✅ Done | backend, notification, job-supervisor |
| Initialize Prisma schema (20 models) | ✅ Done | Prisma 7.4.2, `prisma.config.ts` pattern |
| Docker environment | ✅ Done | `backend/infra/docker/docker-compose.yml` |

## Phase 2 — Core Backend ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| Express server setup | ✅ Done | helmet, cors, morgan, compression, requestLogger |
| JWT authentication | ✅ Done | register, login, logout, refresh-token, verify-email |
| User profile & document endpoints | ✅ Done | profile, verify-document, documents, host-verification |
| Hotel endpoints | ✅ Done | CRUD + block-dates + search with 15+ filters |
| Room endpoints | ✅ Done | CRUD + availability + pricing + MinIO images |
| Booking endpoints | ✅ Done | create (Redis lock), cancel, update, check-in/out |
| Review endpoints | ✅ Done | bidirectional, by-booking lookup |
| Messaging endpoints | ✅ Done | send, thread, conversations, mark-read, unread-count |
| Wishlist endpoints | ✅ Done | add, list, remove |
| Notification endpoints | ✅ Done | list, mark-read, delete |
| Support ticket endpoints | ✅ Done | create, list, get, reply |
| Search history endpoints | ✅ Done | add, list, clear |
| Incident report endpoints | ✅ Done | report, get, resolve (role-guarded) |
| Payment endpoints | ✅ Done | create-order, webhook, get, get-by-booking |

## Phase 3 — Payment & Concurrency ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| Redis integration | ✅ Done | Connection pooling, pub/sub client |
| Booking Redis lock mechanism | ✅ Done | 5s TTL, prevents double-booking |
| Razorpay order creation | ✅ Done | Amount in paise, bookingId as receipt |
| Razorpay webhook (HMAC) | ✅ Done | Raw body capture via `express.json` verify callback |
| Booking expiration (10 min) | ✅ Done | Handled by job-supervisor CRON |
| Service fee & tax calculation | ✅ Done | ServiceFeeConfig + TaxConfiguration tables |
| Cancellation & refund logic | ✅ Done | Policy-based refund percentage |

## Phase 4 — Image Storage ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| MinIO integration | ✅ Done | Bucket init script, client config |
| Presigned URL endpoint | ✅ Done | GET /api/rooms/:id/images/presigned-url |
| Direct upload endpoint | ✅ Done | POST /api/rooms/:id/images |
| Image delete endpoint | ✅ Done | DELETE /api/rooms/:id/images/:imageKey |

## Phase 4b — Microservices Architecture ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| eventPublisher utility | ✅ Done | `backend/src/utils/eventPublisher.ts` — fire-and-forget Redis PUBLISH |
| Wire events into backend services | ✅ Done | booking, payment, message, review services publish events |
| notification-service scaffold | ✅ Done | `services/notification/` — 23 files |
| Gmail SMTP email service | ✅ Done | nodemailer, smtp.gmail.com:587, 5 HTML templates |
| In-app notification DB writer | ✅ Done | Prisma createInAppNotification() |
| 14 event handlers | ✅ Done | All booking/payment/message/review/reminder/system events |
| job-supervisor scaffold | ✅ Done | `services/job-supervisor/` — 17 files |
| BookingExpiry CRON job | ✅ Done | Every 5 min — marks PENDING expired bookings, publishes booking.expired |
| CheckoutReminder CRON job | ✅ Done | Every hour — check-in/out reminders for tomorrow |
| RoomCleaning CRON job | ✅ Done | Every 30 min — advisory cleaning log |
| SuperhostCalc CRON job | ✅ Done | Daily 2AM — recalculates host metrics, upserts HostVerification |
| IncidentEscalation CRON job | ✅ Done | Every 4 hrs — escalates 48h+ open incidents |
| Docker Compose updated | ✅ Done | notification-service + job-supervisor containers |
| Prisma 7 config for both services | ✅ Done | prisma.config.ts + schema.prisma (no url in datasource) |
| Dependencies installed | ✅ Done | pnpm install + prisma generate in both services |

## Phase 4c — Bug Fixes (March 11, 2026) ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| Fix dead-code publishEvent in booking.service.ts | ✅ Done | Moved inside try block before return |
| Fix Razorpay webhook HMAC | ✅ Done | rawBody from express.json verify callback, not JSON.stringify |
| Fix review route ordering | ✅ Done | GET /booking/:bookingId now before GET /:id |
| Fix payment route ordering | ✅ Done | GET /booking/:bookingId now before GET /:id |
| Fix POST /review route dropped during reorder | ✅ Done | Restored after accidental omission |
| Add requireRole to resolve incident | ✅ Done | PATCH /reports/:id/resolve requires host or admin |
| Add GET /api/bookings/host | ✅ Done | New route + getHostBookings() service method |

## Phase 5 — Frontend Core ⏳ NOT STARTED
| Task | Status | Notes |
|------|--------|-------|
| Next.js project setup | ⏳ Not Started | TypeScript, TailwindCSS, shadcn/ui |
| Auth pages | ⏳ Not Started | Login, register, logout, email verify |
| Hotel search page | ⏳ Not Started | Map integration (Leaflet or Mapbox) |
| Room detail page | ⏳ Not Started | Amenities, photos, availability calendar |

## Phase 6 — Booking & Payment UI ⏳ NOT STARTED
| Task | Status | Notes |
|------|--------|-------|
| Booking form & calendar | ⏳ Not Started | Date picker with unavailable dates |
| Razorpay checkout modal | ⏳ Not Started | Webhook status handling |
| Payment success/failed pages | ⏳ Not Started | |
| Booking history UI | ⏳ Not Started | Guest + host views |

## Phase 7 — Advanced Frontend ⏳ NOT STARTED
| Task | Status | Notes |
|------|--------|-------|
| Reviews & ratings UI | ⏳ Not Started | Submit, view, ratings breakdown |
| Host dashboard | ⏳ Not Started | Incoming bookings (GET /bookings/host), room management |
| Messaging UI | ⏳ Not Started | Thread view, real-time (WebSocket future) |
| Notification centre | ⏳ Not Started | Bell icon, mark-read, list |
| Wishlist UI | ⏳ Not Started | Save / view / remove |

## Phase 8 — Deployment & Testing ⏳ NOT STARTED
| Task | Status | Notes |
|------|--------|-------|
| Unit tests (Jest) | ⏳ Not Started | Backend service layer |
| Integration tests | ⏳ Not Started | API endpoint testing via supertest |
| E2E tests (Playwright) | ⏳ Not Started | Critical user flows |
| Docker production configs | ⏳ Not Started | Multi-stage builds |
| Vercel deployment | ⏳ Not Started | Frontend |

---

**Total Tasks:** 57  
**Completed:** 40  
**In Progress:** 0  
**Not Started:** 17

## Phase 9 — Host Parity Roadmap (Airbnb Gap Closure) 🚧 IN PROGRESS
| Task | Status | Notes |
|------|--------|-------|
| Host earnings API (gross/net/fees/tax/pending) | ✅ Done | `GET /api/host/finance/earnings` |
| Host transactions API | ✅ Done | `GET /api/host/finance/transactions` |
| Host earnings page | ✅ Done | `/host/earnings` wired with React Query |
| Host payout setup API (bank/payout method) | ✅ Done | `GET/PUT /api/host/finance/payout-account` |
| Host payout history API | ✅ Done | `GET /api/host/finance/payouts` + `POST /api/host/finance/payouts/request` |
| Advanced calendar rules API | ✅ Done | `GET/PUT /api/hotels/:id/calendar-rules` + host page `/host/hotels/:id/calendar-rules` |
| iCal import/export API | ✅ Done | Export endpoint + source CRUD + manual/source sync + host page `/host/hotels/:id/ical-sync` |
| Pricing rules API | ✅ Done | `GET/PUT /api/hotels/:id/pricing-rules` + host page `/host/hotels/:id/pricing-rules` |
| Reservation accept/decline/alter APIs | ✅ Done | `POST /api/bookings/:id/host/accept`, `POST /api/bookings/:id/host/decline`, `PATCH /api/bookings/:id/host/alter` + host bookings UI actions |
| Host cancellation policy per listing | ✅ Done | `GET/PUT /api/host/tools/hotels/:hotelId/cancellation-policy` + host tools UI |
| Quick replies API | ✅ Done | `GET/POST/DELETE /api/host/tools/quick-replies` + host tools UI |
| Scheduled message API | ✅ Done | `GET/POST /api/host/tools/scheduled-messages` + cancel endpoint + host tools UI |
| Host analytics API suite | ✅ Done | `GET /api/host/tools/analytics` + host tools KPI panel |
| Co-host permissions API | ✅ Done | `GET/POST/DELETE /api/host/tools/hotels/:hotelId/cohosts` + revenue split/permissions |
| Compliance checklist API | ✅ Done | `GET/PUT /api/host/tools/hotels/:hotelId/compliance-checklist` + host tools UI |


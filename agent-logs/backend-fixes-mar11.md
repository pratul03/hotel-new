# Backend Fixes & Improvements — March 11, 2026

## Summary
Addressed all findings from the March 11 codebase audit. 6 bugs/missing features fixed, plans.md and tasks.md brought fully up to date.

---

## Fixes Applied

### 1. ✅ Dead-code publishEvent in `booking.service.ts`
**File:** `backend/src/services/booking.service.ts`
**Problem:** The `publishEvent("booking.created", ...)` block and the second `return booking` statement were placed **after** the `try/finally` block. Since `return booking` inside `try` causes `finally` to run then the function to return, everything after `finally` was dead code. The `booking.created` event was never published and a second `return booking` referenced `booking` out of scope.
**Fix:** Moved the fire-and-forget `prisma.booking.findUnique().then(publishEvent)` block inside the `try` block, immediately before `return booking`. The `finally` still runs after the function returns to release the Redis lock. No logic change — lock release timing is identical.

---

### 2. ✅ Razorpay Webhook HMAC using re-serialized body
**Files:** `backend/src/middleware/setup.ts`, `backend/src/routes/payments.routes.ts`
**Problem:** `POST /api/payments/webhook` was computing the raw body as `JSON.stringify(req.body || {})`. Since `express.json()` already parsed the request bytes into a JS object, re-serializing could produce different key ordering or whitespace than the original bytes — causing Razorpay's HMAC signature verification to fail for valid webhooks.
**Fix:**
- Added `verify` callback to `express.json()` in `setup.ts` that stores the raw UTF-8 buffer on `req.rawBody` before parsing.
- Updated webhook handler in `payments.routes.ts` to use `req.rawBody` instead of `JSON.stringify(req.body)`.

---

### 3. ✅ Route ordering bug in `review.routes.ts`
**File:** `backend/src/routes/review.routes.ts`
**Problem:** `GET /booking/:bookingId` was registered **after** `GET /:id`. Express matches routes top-to-bottom, so a request to `/booking/abc` would match `/:id` with `id = "booking"` and never reach the booking-specific handler.
**Fix:** Reordered routes — `GET /booking/:bookingId` is now registered before `GET /:id`.
**Also fixed:** The `POST /` (create review) route was accidentally dropped during reordering and was restored.

---

### 4. ✅ Route ordering bug in `payments.routes.ts`
**File:** `backend/src/routes/payments.routes.ts`
**Problem:** Same issue — `GET /booking/:bookingId` was registered after `GET /:id`, making the booking-specific payment lookup unreachable.
**Fix:** Moved `GET /booking/:bookingId` to be registered before `GET /:id`.

---

### 5. ✅ Missing role guard on `PATCH /api/reports/:id/resolve`
**File:** `backend/src/routes/reports.routes.ts`
**Problem:** Any authenticated user could mark any incident as resolved, regardless of their role.
**Fix:** Added `requireRole(['host', 'admin'])` middleware to the resolve route. Now only hosts and admins can resolve incidents. Added `requireRole` to the import statement.

---

### 6. ✅ No endpoint for hosts to view incoming bookings
**Files:** `backend/src/routes/booking.routes.ts`, `backend/src/services/booking.service.ts`
**Problem:** `GET /api/bookings/me` returned only the authenticated user's own bookings as a guest. Hosts had no API endpoint to see bookings made on their rooms.
**Fix:**
- Added `getHostBookings(hostId)` to `bookingService` — queries all bookings where `room.hotel.ownerId === hostId`, includes guest info, room/hotel details, and payment.
- Added `GET /api/bookings/host` route with `authenticate` + `requireRole(['host', 'admin'])` guard.

---

## Plans & Tasks Updated
- `agent-logs/plans.md` — Fully rewritten Section 1 (architecture) and Section 7 (background jobs) to reflect actual microservice implementation. Section 14 (notifications) updated. Development workflow phases updated with ✅ completion marks through Phase 4c.
- `agent-logs/tasks.md` — Completely rewritten. All 40 completed backend tasks marked ✅. 17 remaining frontend/testing tasks listed as ⏳ Not Started.

---

## Zero Errors Confirmed
```
get_errors(["d:\\my-bnb\\backend\\src"]) → No errors found
```

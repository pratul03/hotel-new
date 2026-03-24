# Host Plan (Airbnb Benchmark)

Date: 2026-03-13

This document compares current host features in this project against common Airbnb host capabilities (from Airbnb Hosting pages/resources).

## 0) Completion Tracker

- [x] Host payouts and earnings dashboard (backend + frontend)
- [x] Calendar parity foundations:
  - [x] iCal import/export/sync
  - [x] Calendar booking rules
- [x] Pricing rules and discount controls
- [x] Reservation operations:
  - [x] Host accept booking
  - [x] Host decline booking
  - [x] Host alter booking
- [x] Listing quality tooling bundle
- [x] Messaging productivity bundle
- [x] Host reputation/quality KPI dashboard
- [x] Co-host/team features
- [x] Advanced analytics suite
- [x] Compliance and host claims workflows

## 1) What We Have Today

### Core hosting operations
- Host role and host auth path in backend and frontend.
- Host can create, edit, and manage hotels/listings.
- Host can add, edit, and delete rooms per hotel.
- Host can set basic listing controls:
  - check-in/check-out times
  - public rules
  - instant booking toggle
  - amenities

### Availability and booking control
- Block dates at hotel/room level.
- Host bookings page with booking list and check-in confirmation action.
- Booking conflict prevention and date overlap checks on backend.

### Guest communication and quality
- In-app messaging between users.
- Review system exists (post-stay flow and rating/comment support).

### Host profile and trust
- Host business profile CRUD (company, website, business type, description).
- Host document verification flow/page.
- Superhost calculation job exists in services layer.

### Payments, safety, and support
- Payment integration with order creation + webhook handling.
- Incident reporting flow exists.
- Support ticket flow exists.

### Promotion/discovery support
- Promote/unpromote listing capability exists.

---

## 2) What Is Missing vs Airbnb Host Experience

## P0 (Critical for real host business operations)
- Host payouts and earnings dashboard: Completed.
- Calendar parity foundations: Completed (advanced visual multi-month calendar UX still pending).
- Pricing engine foundations: Completed (competitor/comparable pricing insights still pending).

## P1 (High impact product parity)
- Reservation operations:
  - Host accept/decline/alter reservation flow is now completed.
  - Cancellation-policy management by listing is now completed.
  - No-show lifecycle controls are now completed.
- Listing quality tooling:
  - Completed with listing quality toolkit (cover image, guidebook, house manual, check-in steps) and completeness scoring.
- Messaging productivity:
  - Completed with quick replies/templates and scheduled messaging APIs/pages.
- Reviews and reputation for host:
  - Completed with host KPI analytics (rating/cancellation/occupancy/revenue trends).

## P2 (Scale and differentiation)
- Co-hosting / team features:
  - Completed with co-host assignment, permissions, and revenue split controls.
- Host analytics suite:
  - Completed with booking conversion, cancellation rate, occupancy, lead-time, and revenue metrics.
- Compliance and policy automation:
  - Completed with per-hotel jurisdiction compliance checklist workflow.
- Protection and risk tooling:
  - Completed with host claim creation and tracking workflow.

---

## 3) Suggested Build Roadmap

### Phase A (P0 baseline)
1. Build Host Payouts + Earnings module.
2. Build advanced calendar rules and calendar UI.
3. Build pricing rules + discount engine.

### Phase B (P1 operations)
1. Add reservation accept/decline/alter and host cancellation policy controls.
2. Add quick replies and scheduled host messages.
3. Add host quality dashboard (ratings/response/cancellation trends).

### Phase C (P2 scale)
1. Add co-host permissions model.
2. Add analytics suite (occupancy, conversion, demand).
3. Add compliance and claims workflows.

---

## 4) Current Recommendation

If the goal is to be Airbnb-like for hosts as soon as possible, start with:
1. Payouts + earnings visibility.
2. Calendar and pricing intelligence.
3. Reservation operations controls.

These three areas create the biggest host trust and day-to-day operational value.

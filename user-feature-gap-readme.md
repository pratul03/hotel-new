# User Feature Gap Report (My BnB vs Airbnb)

## Scope
This report compares core Airbnb guest/user features with current guest-facing capabilities in this repository.

## Current Coverage Summary
- Implemented: account auth, profile basics, hotel discovery, booking lifecycle basics, wishlist, messaging, notifications, payments, reviews, support tickets.
- Partial: search quality, trip management depth, pricing transparency depth, trust/safety depth.
- Missing: map-first UX, flexible discovery tools, strong cancellation/refund UX parity, advanced trust/safety, loyalty/subscriptions, multi-currency/localization, and robust self-service tooling.

## Feature Matrix

| Area | Airbnb User Expectation | Current State | Gap Level | Notes |
|---|---|---|---|---|
| Authentication | Register/login/logout, email verification, secure account recovery | Implemented (basic) | Medium | Missing robust password reset, session management, MFA |
| Profile | Edit profile, avatar, identity, account controls | Partial | Medium | Basic profile edit exists; account security/privacy controls are limited |
| Discovery Search | Location/date/guests filters, smart ranking | Partial | High | Search exists but advanced filters/ranking are limited |
| Map Discovery | Interactive map + price pins + map filters | Missing | Critical | No user map-first browsing flow |
| Listing Detail | Photos, amenities, host info, house rules, room options | Partial | Medium | Core details exist; rich media, policy clarity, and UX depth are lower |
| Availability + Pricing | Live availability, clear nightly breakdown, fees/taxes | Partial | Medium | Pricing and breakdown exist for booking flow, but fewer parity-level controls |
| Wishlist | Save/unsave listings, organize lists | Partial | Medium | Single wishlist behavior exists; no custom named lists/collaboration |
| Booking | Create/view/cancel bookings, status tracking | Partial | Medium | Core flows exist; fewer modification/self-service options than Airbnb |
| Payments | Payment intent/order, success/failure and webhook processing | Partial | Medium | Basic payment path exists; fewer payment methods and failure recovery patterns |
| Messaging | Host-guest conversations, unread counts | Partial | Medium | Messaging exists but lacks advanced UX features (attachments, templates for guests, etc.) |
| Reviews | Post-booking ratings/reviews | Partial | Medium | Basic review model exists; fewer moderation and reputation UX features |
| Notifications | In-app notifications and read state | Partial | Medium | In-app exists; multichannel preference center is limited |
| Support | Ticket creation, replies, status | Partial | Medium | Support ticketing exists; no real-time chat/call escalation UX |
| Search History | Save/list/clear history | Implemented (basic) | Low | Exists but lacks smart recommendations based on behavior |
| Localization | Language, currency, locale-specific formatting | Missing | High | No strong user-level locale/currency controls |
| Trust & Safety | Report flows, emergency support, safety line, verification depth | Partial | High | Some host/report tooling exists; guest safety tooling parity is limited |
| Cancellation/Refund UX | Clear cancellation windows, auto refund logic visibility | Partial | High | Cancellation exists but less policy-rich and less transparent than Airbnb |
| Loyalty/Promotions | Credits, referral rewards, coupons, subscriptions | Missing | High | No Airbnb-like loyalty and credit systems |
| Accessibility | Deep accessibility metadata and filters | Missing | High | Accessibility filters/details not visible at parity level |

## What You Already Do Well
- End-to-end baseline for booking products is present (search -> detail -> booking -> payment -> trip management).
- Core communication loop exists (messages + notifications + support tickets).
- Host and guest functional modules are clearly separated and extensible.

## Highest-Impact Missing Features (Guest Side)
1. Map-first discovery with viewport-aware searching.
2. Advanced filter system (price sliders, property type, amenities, cancellation policy, ratings, instant book, accessibility).
3. Strong cancellation/refund policy UX with transparent amounts and timelines.
4. Account security center (password reset lifecycle, active sessions, optional MFA).
5. Localization (currency + language + regional date/number formatting).

## Recommended Implementation Order
1. Discovery parity pack
- Map UI, filter drawer, sorting options, saved searches.

2. Trust + transaction confidence pack
- Cancellation policy visibility, refund preview, safer checkout explanations.

3. Account/security pack
- Password reset, device/session management, optional MFA.

4. Experience quality pack
- Better photos/media, richer review UX, guest-facing quality signals.

5. Global readiness pack
- Multi-currency display, locale handling, translation scaffolding.

## API and UI Signals Used For This Assessment
- Backend route coverage in auth, hotels, rooms, bookings, payments, messages, notifications, reviews, support, users, wishlist, search-history.
- Frontend route coverage in home/search/hotel details/bookings/messages/notifications/profile/support/wishlist/payment result pages.

## Notes on Interpretation
- A feature marked Partial means there is a baseline implementation, but Airbnb-level depth, UX quality, edge-case handling, or policy tooling is missing.
- This report is intentionally user/guest-centric; host parity is tracked separately.

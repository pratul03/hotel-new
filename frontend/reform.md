# CRM Reform Plan (Admin, Guest, Host)

## Why this reform

The current sidebar mixes concerns across roles.

Observed issue in current UI:

- Admin currently gets the full Guest + Host navigation, plus one Admin section.
- This creates a cluttered and confusing CRM experience.

Target:

- Each role should see only its own primary workspace navigation.
- Shared pages should remain available where needed, but not force unrelated menu groups.

## Role model

- guest: traveler/customer workspace
- host: property manager workspace
- admin: platform operations workspace

## Route inventory and role visibility

Legend:

- Yes: should appear in that role's CRM navigation
- Shared: available to role, but can be grouped under shared utilities
- No: should not be visible in that role's primary sidebar
- Planned: route should exist in reform target but is not implemented yet

### Public and auth routes

| Route                       | Guest | Host | Admin    | Notes                |
| --------------------------- | ----- | ---- | -------- | -------------------- |
| /                           | Yes   | Yes  | Optional | Landing/home entry   |
| /search                     | Yes   | Yes  | Optional | Discovery            |
| /hotels/[id]                | Yes   | Yes  | Optional | Public hotel details |
| /hotels/[id]/rooms/[roomId] | Yes   | Yes  | Optional | Room details         |
| /(auth)/login               | Yes   | Yes  | Yes      | Auth                 |
| /(auth)/register            | Yes   | Yes  | Yes      | Auth                 |
| /(auth)/forgot-password     | Yes   | Yes  | Yes      | Auth                 |
| /(auth)/reset-password      | Yes   | Yes  | Yes      | Auth                 |
| /(auth)/verify-email        | Yes   | Yes  | Yes      | Auth                 |

### Guest CRM routes

| Route            | Guest  | Host     | Admin | Notes                 |
| ---------------- | ------ | -------- | ----- | --------------------- |
| /bookings        | Yes    | Optional | No    | Guest booking list    |
| /bookings/[id]   | Yes    | Optional | No    | Guest booking details |
| /wishlist        | Yes    | Optional | No    | Saved properties      |
| /payment/success | Shared | Shared   | No    | Post-checkout flow    |
| /payment/failed  | Shared | Shared   | No    | Payment retry flow    |

### Shared communication and account routes

| Route                | Guest  | Host     | Admin  | Notes                     |
| -------------------- | ------ | -------- | ------ | ------------------------- |
| /messages            | Shared | Shared   | Shared | Conversations             |
| /messages/[userId]   | Shared | Shared   | Shared | Conversation detail       |
| /notifications       | Shared | Shared   | Shared | Alerts                    |
| /support             | Shared | Shared   | Shared | Help/support              |
| /profile             | Shared | Shared   | Shared | Profile overview          |
| /profile/preferences | Shared | Shared   | Shared | Preferences               |
| /profile/security    | Shared | Shared   | Shared | Security                  |
| /profile/loyalty     | Shared | Optional | No     | Loyalty is traveler-first |
| /profile/documents   | Shared | Shared   | Shared | Identity docs             |

### Host CRM routes

| Route                                 | Guest | Host | Admin | Notes                   |
| ------------------------------------- | ----- | ---- | ----- | ----------------------- |
| /host                                 | No    | Yes  | No    | Host dashboard          |
| /host/hotels                          | No    | Yes  | No    | Host listing management |
| /host/hotels/new                      | No    | Yes  | No    | Add property            |
| /host/hotels/[id]/edit                | No    | Yes  | No    | Edit property           |
| /host/hotels/[id]/rooms               | No    | Yes  | No    | Rooms list              |
| /host/hotels/[id]/rooms/new           | No    | Yes  | No    | Add room                |
| /host/hotels/[id]/rooms/[roomId]/edit | No    | Yes  | No    | Edit room               |
| /host/hotels/[id]/pricing-rules       | No    | Yes  | No    | Pricing policies        |
| /host/hotels/[id]/calendar-rules      | No    | Yes  | No    | Availability rules      |
| /host/hotels/[id]/block-dates         | No    | Yes  | No    | Blocked dates           |
| /host/hotels/[id]/ical-sync           | No    | Yes  | No    | Calendar sync           |
| /host/bookings                        | No    | Yes  | No    | Reservation operations  |
| /host/earnings                        | No    | Yes  | No    | Revenue tracking        |
| /host/payouts                         | No    | Yes  | No    | Payout operations       |
| /host/tools                           | No    | Yes  | No    | Host tooling            |
| /host/verification                    | No    | Yes  | No    | KYC/compliance          |
| /host/profile                         | No    | Yes  | No    | Host business profile   |

### Admin CRM routes (current + target)

| Route                | Guest | Host | Admin | Status   | Notes                       |
| -------------------- | ----- | ---- | ----- | -------- | --------------------------- |
| /admin/hotels        | No    | No   | Yes   | Existing | Registered hotels           |
| /admin               | No    | No   | Yes   | Planned  | Admin dashboard             |
| /admin/users         | No    | No   | Yes   | Planned  | User management             |
| /admin/bookings      | No    | No   | Yes   | Planned  | Booking oversight           |
| /admin/payouts       | No    | No   | Yes   | Planned  | Payout approvals            |
| /admin/verifications | No    | No   | Yes   | Planned  | Host verification queue     |
| /admin/support       | No    | No   | Yes   | Planned  | Escalated tickets           |
| /admin/promotions    | No    | No   | Yes   | Planned  | Featured/promoted inventory |
| /admin/settings      | No    | No   | Yes   | Planned  | Platform settings           |

## Sidebar blueprint by role

### Guest sidebar

1. Discover

- Home (/)
- Search (/search)

2. Trips

- My Bookings (/bookings)
- Wishlist (/wishlist)

3. Communication

- Messages (/messages)
- Notifications (/notifications)

4. Account

- Profile (/profile)
- Preferences (/profile/preferences)
- Security (/profile/security)
- Loyalty (/profile/loyalty)
- Documents (/profile/documents)

5. Help

- Support (/support)

### Host sidebar

1. Overview

- Host Dashboard (/host)

2. Listings

- My Hotels (/host/hotels)
- Add Hotel (/host/hotels/new)

3. Operations

- Host Bookings (/host/bookings)

4. Finance

- Earnings (/host/earnings)
- Payouts (/host/payouts)

5. Growth and Compliance

- Tools (/host/tools)
- Verification (/host/verification)

6. Communication

- Messages (/messages)
- Notifications (/notifications)

7. Account

- Host Profile (/host/profile)
- Profile Settings (/profile/preferences)
- Security (/profile/security)
- Documents (/profile/documents)

8. Help

- Support (/support)

### Admin sidebar

1. Overview

- Dashboard (/admin) [Planned]

2. Inventory

- Registered Hotels (/admin/hotels)
- Promotions (/admin/promotions) [Planned]

3. Platform Operations

- Users (/admin/users) [Planned]
- Bookings (/admin/bookings) [Planned]
- Verifications (/admin/verifications) [Planned]

4. Finance

- Payouts (/admin/payouts) [Planned]

5. Trust and Support

- Support Escalations (/admin/support) [Planned]

6. Settings

- Platform Settings (/admin/settings) [Planned]

## Access and UX rules for reform

- Admin should not see Guest or Host navigation blocks in default mode.
- Host should not see Admin navigation.
- Guest should not see Host/Admin navigation.
- Shared pages (messages, notifications, support, account) can be available to all signed-in roles.
- Keep one clear primary workspace per role to avoid sidebar clutter.

## First implementation priorities (after this doc)

1. Refactor sidebar config into role-based menus (guestMenu, hostMenu, adminMenu).
2. Add route-to-role guards so direct URL entry also respects role permissions.
3. Introduce optional workspace switch only if multi-role usage is needed.
4. Add missing Admin routes as placeholders before building full features.

## Phase completion status

- [x] Phase 1: Role-based sidebar configuration completed.
- [x] Phase 2: Route-to-role access guards completed.
- [x] Phase 3: Host workspace switch (Host/Guest mode) completed.
- [x] Phase 4: Missing admin routes scaffolded with placeholder pages.

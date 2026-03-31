# GraphQL Redesign Log

## 2026-03-31

### Session Start
- User requested GraphQL redesign kickoff from existing REST API architecture.
- Decision: incremental migration with dual-run mode (REST + GraphQL).

### Implemented
- Installed GraphQL runtime packages in backend:
  - `graphql`
  - `@apollo/server`
  - `@as-integrations/express5`
- Added GraphQL bootstrap and server mount:
  - `backend/src/graphql/server.ts`
  - mounted at `/api/graphql`
  - health endpoint at `/api/graphql/health`
- Added GraphQL context/auth layer:
  - `backend/src/graphql/context.ts`
  - parses Bearer token, validates JWT, validates session in Redis via `sessionService`
  - helper guards: `requireAuth`, `requireRole`
- Added initial GraphQL schema + resolvers:
  - `backend/src/graphql/schema.ts`
  - Query: `me`, `hotelById`, `searchHotels`
  - Mutation: `register`, `login`, `createHotel`
  - Reuses existing zod schemas and service layer methods
- Updated middleware startup flow:
  - `setupMiddleware` converted to async
  - `src/index.ts` now awaits middleware setup

### Notes
- No REST endpoint removed or modified in behavior.
- GraphQL migration follows service-reuse strategy to keep logic centralized.

### Next
- Add bookings/rooms GraphQL resolvers.
- Add integration tests for auth and hotel GraphQL operations.
- Add GraphQL docs/examples for frontend adoption.

## 2026-03-31 (All Modules Expansion)

### Implemented
- Expanded GraphQL to support every backend module through a service dispatcher bridge.
- Added `JSON` scalar and generic service-call inputs in GraphQL schema.
- Added two GraphQL operations for broad module coverage:
  - `moduleQuery(input: ServiceCallInput!): JSON!`
  - `moduleMutation(input: ServiceCallInput!): JSON!`
- Added registry coverage for all backend modules currently mounted via REST routes:
  - auth, hotel, room, booking, review, wishlist, users, messages, notifications,
    support, search-history, reports, payments, promotions, host-profile,
    host-finance, host-tools, invoices.
- Added auth guard behavior for service-dispatch calls with allow-listed public actions.
- Added `injectAuthUserId` option for actions whose first argument is authenticated `userId`.

### Notes
- Typed GraphQL operations for auth/hotel remain available and unchanged.
- New dispatcher operations enable immediate GraphQL access to all existing service methods without waiting for typed schema parity.

## 2026-03-31 (Strong Typing Hardening)

### Implemented
- Replaced weak service-dispatch input handling with schema-validated input parsing in GraphQL.
- Added structured `ServiceCallInput` parsing backed by `zod` validation for module/action/args.
- Added recursive argument coercion for common scalar shapes before service invocation:
  - Date-like fields (`checkIn`, `checkOut`, `*Date`, `*At`) => `Date`
  - Numeric-like fields (`limit`, `page`, `amount`, `price`, etc.) => `number`
  - Boolean-like fields (`enabled`, `read`, `verified`, etc.) => `boolean`
- Added action existence validation per module with `BAD_USER_INPUT` GraphQL errors.
- Added `moduleActions(module: String!): [String!]!` query to discover every callable action per module.
- Normalized dispatcher responses recursively to avoid lossy type edges and keep output JSON-consistent.

### Result
- All module endpoints remain reachable from GraphQL.
- Input payloads are now validated/coerced into strongly typed runtime data before hitting service/database layers.

## 2026-03-31 (Typed Core Modules Upgrade)

### Implemented
- Added first-class typed GraphQL operations (not only generic dispatcher) for core domains:
  - Bookings: create/update/cancel + host lifecycle actions + preview/risk/rebooking + list/get
  - Rooms: get/availability/pricing + create/update/delete + presigned URL + image delete
  - Payments: create order + queue summary + fx rates + stale reprocess + fx upsert + payment lookups
  - Messages: send + thread + conversations + unread + mark read
  - Notifications: list + unread + mark read/all + preferences get/update + delete
- Wired each typed resolver to existing zod schemas from module `schemas/*.schema.ts` for strong input validation.
- Kept `moduleQuery/moduleMutation` dispatcher as compatibility fallback.

### Result
- Upgraded GraphQL surface now includes typed entry points for all major runtime modules while preserving backward compatibility.

## 2026-03-31 (GraphQL-Only Cutover)

### Implemented
- Removed JSON-based GraphQL API patterns from the public schema:
  - Removed `scalar JSON` usage from endpoint contracts.
  - Removed generic dispatcher endpoints (`moduleQuery`, `moduleMutation`, `moduleActions`).
- Converted operational endpoints to explicit GraphQL object types:
  - Typed Booking, Room, Payment, Message, Notification, FX, and queue result contracts.
  - Typed mutation/query return structures for booking/room/payment/message/notification flows.
- Switched middleware to GraphQL-only mode by disabling REST route mounting.

### Result
- API surface now follows GraphQL-native typed contracts end-to-end, with REST routes no longer exposed from middleware setup.

## 2026-03-31 (Full Module Parity Expansion)

### Implemented
- Expanded typed GraphQL schema/resolvers for remaining modules beyond core booking/room/payment/message/notification:
  - Auth extras: profile update, email verification, refresh token, forgot/reset password, sessions management, MFA setup/verify, logout.
  - Users: profile update, documents CRUD, host verification, loyalty summary, identity verification.
  - Wishlist: collections/list/share/invite/accept/add/remove.
  - Support: ticket lifecycle, emergency creation/escalation, routing console, ops dashboard.
  - Reports: incident create/list/get/update/resolve, AirCover board, off-platform fee case flows.
  - Host profile/finance/tools: profile, earnings/transactions/payouts, policies, quick replies, scheduled messages, analytics, co-hosts, compliance, listing quality, claims, audit export.
  - Promotions: list + validate.
  - Search history: add/list/clear.
  - Invoices: create/list/access URL/revoke/storage audit.
  - Reviews: create/update/delete/list/get.
- Added explicit GraphQL object/input types for these operations and removed need for JSON fallback payloads.
- Added field-level resolvers for date and serialized field normalization (arrays/stringified metadata/checklists/categories).
- Fixed middleware syntax artifact in `setup.ts` and re-validated build.

### Validation
- Backend build passes after parity expansion:
  - `pnpm build` (Prisma generate + TypeScript compile) completed successfully.

### Current State
- Backend is running GraphQL-only mount mode and now exposes strongly typed GraphQL contracts for all routed modules in this codebase.

## 2026-03-31 (Schema Modularization Completion)

### Implemented
- Completed phase-2 resolver modularization under GraphQL schema package:
  - Added composed resolver entry: `backend/src/graphql/schema/resolvers.ts`
  - Split resolver map into dedicated files:
    - `backend/src/graphql/schema/resolvers/query.ts`
    - `backend/src/graphql/schema/resolvers/mutation.ts`
    - `backend/src/graphql/schema/resolvers/typeResolvers.ts`
- Kept root schema export stable via `backend/src/graphql/schema.ts` -> `backend/src/graphql/schema/index.ts`.
- Fixed recurring middleware trailing syntax artifact in `backend/src/middleware/setup.ts` (`};;;` -> `};`).

### Validation
- `pnpm build` passed after modularization and middleware fix.

## 2026-03-31 (REST Layer Removal Completion)

### Implemented
- Deleted legacy REST transport files across all modules:
  - removed all `routes/*.ts`, `controllers/*.ts`, and `queries/*.ts` under `backend/src/modules/**`.
- Removed remaining REST health endpoints from middleware and GraphQL bootstrap:
  - removed `/health` and `/api/v1/health` from `backend/src/middleware/setup.ts`
  - removed `/api/graphql/health` from `backend/src/graphql/server.ts`
- Kept GraphQL transport mounted at `/api/graphql` as the sole API entrypoint.

### Validation
- Confirmed there are no remaining files matching:
  - `backend/src/modules/**/routes/*.ts`
  - `backend/src/modules/**/controllers/*.ts`
  - `backend/src/modules/**/queries/*.ts`
- Re-ran `pnpm build` successfully after deletions and endpoint cleanup.

## 2026-03-31 (GraphQL-First Folder Alignment)

### Implemented
- Removed empty legacy MVC transport directories from each domain:
  - deleted empty `controllers/`, `routes/`, and `queries/` folders under `backend/src/domains/**`.
- Confirmed active domain layout is now transport-agnostic and GraphQL-first:
  - `backend/src/domains/<domain>/schemas`
  - `backend/src/domains/<domain>/services`
  - GraphQL transport under `backend/src/graphql/**`.
- Re-fixed recurring middleware trailing syntax artifact in `backend/src/middleware/setup.ts`.

### Validation
- Backend build passed after directory cleanup (`pnpm build`).

## 2026-03-31 (Type Resolver Domain Split)

### Implemented
- Completed domain-based split for GraphQL field/type resolvers:
  - Added `backend/src/graphql/schema/resolvers/type/core.ts`
  - Added `backend/src/graphql/schema/resolvers/type/account.ts`
  - Added `backend/src/graphql/schema/resolvers/type/wishlist.ts`
  - Added `backend/src/graphql/schema/resolvers/type/supportReports.ts`
  - Added `backend/src/graphql/schema/resolvers/type/host.ts`
  - Added `backend/src/graphql/schema/resolvers/type/commerce.ts`
- Replaced monolithic `backend/src/graphql/schema/resolvers/typeResolvers.ts` with composed imports from domain files.
- Corrected helper import paths for new type resolver files to use `../../helpers`.
- Re-fixed recurring middleware trailing syntax artifact in `backend/src/middleware/setup.ts`.

### Validation
- Backend build passed after type resolver split (`pnpm build`).

## 2026-03-31 (Swagger Documentation for GraphQL APIs)

### Implemented
- Added GraphQL operation catalog generator:
  - `backend/src/docs/graphqlOperationCatalog.ts`
  - Parses `Query` and `Mutation` signatures from composed GraphQL typeDefs.
- Added Swagger/OpenAPI docs module:
  - `backend/src/docs/swagger.ts`
  - Mounts Swagger UI at `/api/docs`
  - Exposes OpenAPI JSON at `/api/docs.json`
  - Exposes machine-readable GraphQL operation index at `/api/docs/graphql-operations`
  - Documents every GraphQL query and mutation signature in the `/api/graphql` operation description.
- Wired Swagger docs into middleware:
  - `backend/src/middleware/setup.ts` now calls `setupSwaggerDocs(app)` before GraphQL mount.
- Updated startup logs:
  - `backend/src/index.ts` now logs GraphQL and docs endpoints.

### Validation
- Backend build passed after docs integration (`pnpm build`).

## 2026-03-31 (Frontend Integration Stabilization)

### Implemented
- Continued frontend GraphQL integration hardening and compile cleanup.
- Installed frontend dependencies and validated app build path end-to-end.
- Fixed strict TypeScript blockers found during `tsc --noEmit`:
  - `app/hotels/[id]/page.tsx`: corrected `StarRating` prop from `rating` to `value`.
  - `components/common/AppForm/AppForm.tsx`: aligned react-hook-form generics/casts for resolver, defaults, submit handler, and field name path typing.
  - `components/common/DataTable/DataTable.tsx`: replaced invalid `Empty` prop usage with composed empty-state slots.
  - `components/common/DataTable/DataTableToolbar.tsx`: fixed debounce callback typing.
  - `components/hotels/HotelCard.tsx`: normalized room images to `string[]` before passing into `AppCard`.
  - `components/layout/AppSidebar.tsx`: replaced non-existent `firstName/lastName` access with `name` + computed initials.

### Validation
- Frontend strict type-check now passes:
  - `pnpm exec tsc --noEmit` (no errors)
- Frontend production build passes:
  - `pnpm build` (Next.js build successful)
- Backend build remains green:
  - `pnpm build` (Prisma generate + TypeScript compile successful)

## 2026-04-01 (PM2 Observability Hardening)

### Implemented
- Upgraded PM2 process configuration for per-service log files:
  - `scripts/ecosystem.backend-services.cjs`
  - Added `logs/pm2/*.out.log`, `*.error.log`, and `*.combined.log` per service.
  - Enabled timestamped PM2 logs and merge mode.
- Added backend-api debug logging envs through PM2 startup:
  - `LOG_API_REQUESTS=true`
  - `LOG_API_BODIES=true`
- Enhanced PM2 startup script:
  - `scripts/start-backend-services-pm2.sh`
  - Ensures `logs/pm2` directory exists.
  - Starts PM2 with `--update-env`.
  - Prints actionable monitor/tail commands.
- Enhanced PM2 monitor script modes:
  - `scripts/monitor-backend-services-pm2.sh`
  - Added `logs`, `endpoints`, and `files` modes.
  - Endpoint mode filters `[HTTP]`, `[REQ]`, `[RES]`, `[GQL]` lines for API tracing.
- Enhanced services wrapper command UX:
  - `scripts/services.sh`
  - Added `endpoints` and `logfiles` commands.
- Hardened backend request logger for endpoint call/response visibility:
  - `backend/src/middleware/requestLogger.ts`
  - Logs request + response payloads (toggle via env).
  - Redacts sensitive fields (password/token/secret/key family).
  - Includes GraphQL operation name extraction in logs.

### Validation
- Bash syntax checks passed for updated scripts.
- Backend build passed after logger changes (`pnpm build`).
- No diagnostics errors in updated scripts/middleware files.

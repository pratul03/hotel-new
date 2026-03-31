# GraphQL API Redesign Tasklist

> Started: 2026-03-31
> Goal: Complete migration to strongly typed GraphQL APIs with REST disabled in middleware.

## Phase 1 - Foundation

| Task | Status | Notes |
| --- | --- | --- |
| Add GraphQL dependencies (`graphql`, `@apollo/server`, `@as-integrations/express5`) | DONE | Installed in `backend/package.json` |
| Add GraphQL endpoint mount (`/api/graphql`) | DONE | Mounted from backend middleware setup |
| Add GraphQL auth context with JWT + session validation | DONE | Reuses existing `sessionService` checks |
| Add GraphQL error model baseline | DONE | Uses GraphQL errors with auth codes |

## Phase 2 - Initial API Migration Slice

| Task | Status | Notes |
| --- | --- | --- |
| Auth mutation: `register` | DONE | Reuses `authService.register` + zod schema |
| Auth mutation: `login` | DONE | Reuses `authService.login` + zod schema |
| Auth query: `me` | DONE | Reuses `authService.getCurrentUser` |
| Hotel query: `hotelById` | DONE | Reuses `hotelService.getHotelById` |
| Hotel query: `searchHotels` | DONE | Reuses `hotelService.searchHotels` |
| Hotel mutation: `createHotel` | DONE | Role-guarded, host/admin |

## Phase 3 - Core Domain Expansion

| Task | Status | Notes |
| --- | --- | --- |
| All-modules GraphQL bridge (`moduleQuery`/`moduleMutation`) | DONE | Temporary compatibility step (later removed) |
| Booking typed GraphQL queries/mutations | DONE | Added typed queries + mutations with zod validation |
| Rooms typed GraphQL queries/mutations | DONE | Added typed queries + mutations with zod validation |
| Payments typed GraphQL mutations | DONE | Added typed payment operations + admin guards |
| Messaging typed GraphQL queries/mutations | DONE | Added typed send/read/thread operations |
| Notifications typed GraphQL queries/mutations | DONE | Added typed list/read/preferences operations |

## Phase 4 - Full Module Typed Parity

| Task | Status | Notes |
| --- | --- | --- |
| Remove JSON/dispatcher fallback from public GraphQL API | DONE | Public schema now explicit typed contracts only |
| Disable REST route mounting in middleware | DONE | GraphQL-only mode active |
| Auth extra flows in GraphQL (sessions/mfa/reset/refresh/verify/profile/logout) | DONE | Added typed queries/mutations |
| Users + wishlist module parity in GraphQL | DONE | Added typed queries/mutations |
| Support + reports module parity in GraphQL | DONE | Added typed queries/mutations |
| Host profile + host finance + host tools parity in GraphQL | DONE | Added typed queries/mutations |
| Promotions + search history parity in GraphQL | DONE | Added typed queries/mutations |
| Invoices + reviews parity in GraphQL | DONE | Added typed queries/mutations |
| Date/serialized-field normalization resolvers for new modules | DONE | Added field resolvers for arrays/dates/stringified objects |
| Compile validation after parity expansion | DONE | `pnpm build` passes |

## Phase 5 - Schema Modularization

| Task | Status | Notes |
| --- | --- | --- |
| Split root schema export into modular package entry | DONE | `backend/src/graphql/schema.ts` re-exports from `schema/index.ts` |
| Split resolvers into dedicated files | DONE | Query/Mutation/type resolvers split under `schema/resolvers/` |
| Split type resolvers by domain | DONE | Domain files added under `schema/resolvers/type/` and composed in `typeResolvers.ts` |
| Keep runtime behavior unchanged while splitting files | DONE | Resolver composition preserved in `schema/resolvers.ts` |
| Validate build after resolver modularization | DONE | `pnpm build` passes |
| Fix middleware syntax regression after refactor edits | DONE | `setup.ts` trailing syntax corrected |

## Phase 6 - REST Layer Removal Completion

| Task | Status | Notes |
| --- | --- | --- |
| Delete module REST route files | DONE | Removed `backend/src/modules/**/routes/*.ts` |
| Delete module REST controller files | DONE | Removed `backend/src/modules/**/controllers/*.ts` |
| Delete module REST query helper files | DONE | Removed `backend/src/modules/**/queries/*.ts` |
| Remove middleware REST health endpoints | DONE | Removed `/health` and `/api/v1/health` |
| Remove GraphQL server REST health endpoint | DONE | Removed `/api/graphql/health` |
| Compile validation after REST file deletion | DONE | `pnpm build` passes |

## Phase 7 - Folder Structure Alignment

| Task | Status | Notes |
| --- | --- | --- |
| Remove empty legacy MVC directories (`controllers/routes/queries`) | DONE | Cleaned from `backend/src/domains/**` |
| Keep domain logic under `schemas` + `services` only | DONE | GraphQL transport stays under `backend/src/graphql/**` |
| Validate build after folder cleanup | DONE | `pnpm build` passes |

## Phase 8 - Hardening and Adoption

| Task | Status | Notes |
| --- | --- | --- |
| Add GraphQL integration tests | TODO | start with auth + hotel paths |
| Add GraphQL docs and sample operations | DONE | Swagger UI `/api/docs`, JSON `/api/docs.json`, operations index `/api/docs/graphql-operations` |
| Add query complexity/depth limits | TODO | avoid expensive nested queries |
| Add persisted queries/caching strategy | TODO | optimize mobile/web clients |
| Add GraphQL E2E tests for newly migrated modules | TODO | auth/users/wishlist/support/reports/host/invoices/reviews |
| Add schema docs and operation examples for frontend | DONE | Query/mutation signatures rendered in Swagger docs from operation catalog |

## Phase 9 - Frontend GraphQL Integration

| Task | Status | Notes |
| --- | --- | --- |
| Restore frontend dependency state for GraphQL client build path | DONE | Ran `pnpm install` in `frontend` |
| Resolve strict TypeScript frontend blockers during GraphQL compatibility rollout | DONE | Fixed issues in hotel details, AppForm, DataTable, HotelCard, AppSidebar |
| Validate strict frontend compile (`tsc --noEmit`) | DONE | No type errors |
| Validate frontend production build | DONE | `pnpm build` successful |
| Re-validate backend build after frontend iteration | DONE | `pnpm build` successful |

## Phase 10 - Runtime Observability (PM2)

| Task | Status | Notes |
| --- | --- | --- |
| Configure per-service PM2 log files | DONE | Added out/error/combined logs under `logs/pm2` in ecosystem config |
| Add endpoint-focused PM2 monitor modes | DONE | `monitor-backend-services-pm2.sh` supports `logs`, `endpoints`, `files` |
| Extend services wrapper with endpoint/logfile commands | DONE | Added `endpoints` and `logfiles` commands in `scripts/services.sh` |
| Capture request + response payload logs in backend API | DONE | Enhanced `requestLogger` with redaction + GraphQL operation tags |
| Validate scripts/backend after observability changes | DONE | Bash syntax checks + `pnpm build` passed |

## Operating Rules

1. GraphQL schema contracts remain strongly typed; avoid reintroducing generic JSON dispatcher endpoints.
2. GraphQL resolvers should continue to delegate to existing services to keep business logic centralized.
3. Every migration step must be logged in `agent-logs/graphql-redesign-log.md`.

# Backend Module Refactor Progress

## Goal
Refactor each backend module to a consistent layered structure:
- Thin route files (only route definitions + middleware + controller wiring)
- Controller files for request/response handling
- Schema files for Zod validation schemas
- Service files for business logic

## Module Tracker
| # | Module | Status | Updated On | Notes |
|---|---|---|---|---|
| 1 | auth | Completed | 2026-03-30 | Moved route-level Zod validation and handler logic into `controllers/auth.controller.ts` and `schemas/auth.schema.ts`. Routes now delegate to controller using `catchAsync`. |
| 2 | booking | Completed | 2026-03-30 | Moved route-level Zod validation and handler logic into `controllers/booking.controller.ts` and `schemas/booking.schema.ts`. Routes now delegate to controller using `catchAsync`. |
| 3 | host-finance | Completed | 2026-03-30 | Refactored to layered structure: routes now delegate to `controllers/host-finance.controller.ts`; schemas centralized in `schemas/host-finance.schema.ts`. |
| 4 | host-profile | Completed | 2026-03-30 | Refactored to layered structure: routes now delegate to `controllers/host-profile.controller.ts`; schemas centralized in `schemas/host-profile.schema.ts`. |
| 5 | host-tools | Completed | 2026-03-30 | Refactored to layered structure with class-based controller (`controllers/host-tools.controller.ts`), dedicated query parser (`queries/host-tools.queries.ts`), and thin routes wired via `catchAsync`. |
| 6 | hotel | Completed | 2026-03-30 | Added full layered split with `controllers/hotel.controller.ts` and `queries/hotel.queries.ts`; routes are now thin and delegate through `catchAsync`. |
| 7 | invoices | Already Layered | 2026-03-30 | Existing controller + schema split already in place. |
| 8 | messages | Completed | 2026-03-30 | Added controller/query layers and moved route handlers to `controllers/messages.controller.ts`. |
| 9 | notifications | Completed | 2026-03-30 | Added controller/query layers and delegated all route logic to `controllers/notifications.controller.ts`. |
| 10 | payments | Already Layered | 2026-03-30 | Existing controller + schema split already in place. |
| 11 | promotions | Completed | 2026-03-30 | Introduced controller/query split and converted routes to thin `catchAsync` wrappers. |
| 12 | reports | Completed | 2026-03-30 | Added full controller/query layers and moved all report endpoint orchestration out of routes. |
| 13 | review | Completed | 2026-03-30 | Added controller/query layers while preserving existing CRUD + ownership checks. |
| 14 | room | Completed | 2026-03-30 | Added controller/query layers including date-range and upload flows; routes now thin. |
| 15 | search-history | Completed | 2026-03-30 | Added controller/query split and delegated all route handlers to controller. |
| 16 | support | Completed | 2026-03-30 | Added controller/query layers and centralized schema parsing in controller methods. |
| 17 | users | Completed | 2026-03-30 | Added controller/query layers and migrated all profile/document/verification handlers out of routes. |
| 18 | wishlist | Completed | 2026-03-30 | Added controller/query layers and migrated collaboration + list handlers from routes. |

## Change Log
### 2026-03-30
- Completed module `auth` refactor to layered structure.
- Completed module `booking` refactor to layered structure.
- Hardened `auth` and `booking` schema definitions with coercion + input normalization (trim/lowercase/limits) to improve sanitized inputs.
- Filled and hardened schema definitions for all remaining modules (`host-finance`, `host-profile`, `host-tools`, `hotel`, `messages`, `notifications`, `promotions`, `reports`, `review`, `room`, `search-history`, `support`, `users`, `wishlist`, plus hardened `invoices` and `payments`).
- Migrated schema string format validators to modern Zod format APIs (`z.iso.datetime()`, `z.url()`, `z.email()`) to avoid deprecated chained formats.
- Centralized schema validation imports via shared `src/utils/validation.ts` and updated all module schema files to use that single entrypoint.
- Added OOP-style reusable validation builder (`ValidationFactory` / `v`) in `src/utils/validation.ts` and migrated repeated format validators across all schemas to shared helpers (`v.isoDateTime`, `v.url`, `v.email`).
- Began adopting reusable helper primitives (`v.id`, `v.positiveInt`, `v.text`) in module schemas (`auth`, `booking`) to reduce repetitive validation chains.
- Applied helper primitive migration across all schema files (`v.id`, `v.text`, `v.int`, `v.number`, `v.bool`, `v.positiveInt`, `v.positiveNumber`) for consistent reuse and easier extension.
- Completed module `host-tools` layered refactor with controller + query code splitting.
- Filled missing query-layer implementations for completed modules (`auth`, `booking`, `host-finance`, `host-profile`) and wired controllers to use query helpers.
- Completed module `host-finance` layered refactor.
- Completed module `host-profile` layered refactor.
- Added persistent module tracker for sequential refactor work.
- Completed remaining module refactors (`hotel`, `messages`, `notifications`, `promotions`, `reports`, `review`, `room`, `search-history`, `support`, `users`, `wishlist`) by adding controller + query layers and converting routes to thin middleware/wiring files.
- Verified end-to-end compile stability after full refactor batch with `pnpm build`.

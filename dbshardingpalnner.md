# Local DB Sharding Planner

## Short Answer
Yes, this is possible locally. You can simulate:
- 1 write-primary database
- 2 read databases (replicas or read shards)
- per-node caching and connection pooling
- an app-level router that sends writes to primary and reads to read nodes

## Important Clarification Before Build
There are two different patterns:
1. Primary + read replicas (most common)
- Writes go to primary.
- Reads go to replicas.
- Data stays logically one dataset.

2. True sharding (horizontal partitioning)
- Data is split by shard key (for example `userId % N` or geo).
- Reads and writes route to the shard owning that key.
- Cross-shard queries and transactions become harder.

Your request sounds like a hybrid. For local development, start with primary + replicas first, then add true sharding only where needed.

## Proposed Local Topology
- `postgres-primary`: write source of truth
- `postgres-read-1`: read node (replica or independent read shard)
- `postgres-read-2`: read node (replica or independent read shard)
- `redis-read-1`: cache for read path 1
- `redis-read-2`: cache for read path 2
- `pgbouncer-primary`: connection pool for writes
- `pgbouncer-read-1`: connection pool for read-1
- `pgbouncer-read-2`: connection pool for read-2

## What We Need To Decide First
1. Data strategy
- Replica model or true shard model?
- If shard model: choose shard key (`userId`, `hotelId`, region, etc.).
- Define re-sharding strategy when a shard grows too large.

2. Read/write routing rules
- Which endpoints are read-only?
- Which reads must be strongly consistent and hit primary?
- How to handle read-after-write lag?

3. Caching policy
- Cache key naming strategy.
- TTL per entity type (search results, hotel details, bookings).
- Invalidation on write (write-through, write-behind, or explicit delete).
- Stale-while-revalidate behavior.

4. Connection pooling and limits
- Pool sizes per DB node.
- Max total connections across all services.
- Timeouts and retry strategy.

5. Replication/shard sync behavior
- If replicas: async replication lag tolerance.
- If shards: no replication by default unless you add shard replicas.

6. Failure handling
- Read node unavailable: fallback to other read node or primary?
- Primary unavailable: fail-fast or local failover simulation?
- Circuit breaker behavior in app layer.

7. Migrations and schema consistency
- Ensure same schema version across all nodes.
- Migration order in local environment.
- Safe rollback plan.

8. Transactions and data integrity
- Avoid cross-shard ACID transactions where possible.
- Introduce idempotency keys for write APIs.
- Use outbox/event-driven patterns for distributed side effects.

9. Observability
- Per-node metrics: QPS, latency, errors, pool usage.
- Replication lag metrics.
- Cache hit/miss ratio per read path.
- Structured logs including route target (primary/read-1/read-2/shard-id).

10. Security and secrets
- Separate credentials for each node.
- Least privilege users (read-only users for read nodes).
- .env naming convention and secret hygiene.

## Prisma/Backend Considerations
- Prisma supports datasource config, but app-level multi-node routing usually requires:
  - multiple Prisma clients or
  - Prisma + lower-level `pg` clients for specialized routing.
- Keep one canonical write client.
- Add read clients and a routing layer in services/repositories.
- Add guardrails so write operations cannot run on read clients.

## Minimal Local Implementation Plan (Phased)
1. Phase 1: Read/Write Split (No True Sharding)
- Add docker services for primary + 2 read nodes + Redis + PgBouncer.
- Add env vars:
  - `DATABASE_URL_WRITE`
  - `DATABASE_URL_READ_1`
  - `DATABASE_URL_READ_2`
  - `REDIS_URL_READ_1`
  - `REDIS_URL_READ_2`
- Add routing helper in backend (`getReadClient`, `getWriteClient`).
- Mark selected endpoints as read-only and route accordingly.

2. Phase 2: Cache + Invalidation
- Implement cache-aside for heavy read endpoints.
- Add invalidation on booking/hotel/review writes.
- Add per-endpoint TTL policy.

3. Phase 3: Local Resilience Tests
- Kill one read node and verify fallback.
- Simulate replication lag and validate consistency-sensitive paths.
- Verify pool saturation behavior under load.

4. Phase 4: Optional True Sharding Pilot
- Pick one bounded domain (for example search-history) as first shard candidate.
- Introduce shard map service.
- Add shard-aware read/write routing and tests.

## Risks To Acknowledge Early
- Operational complexity increases quickly.
- Debugging inconsistent reads becomes harder.
- Cross-shard reporting and joins become expensive.
- Incorrect cache invalidation can mask stale data issues.

## Definition Of Ready Before Implementation
- Chosen architecture: replicas-only or shard strategy documented.
- Read consistency matrix defined per endpoint.
- Env variable contract finalized.
- Failure and fallback policy agreed.
- Metrics and test plan agreed.

## Suggested Next Step
Create a concrete local `docker-compose` architecture document with service names, ports, replication/shard bootstrap scripts, and env contract before writing app code.

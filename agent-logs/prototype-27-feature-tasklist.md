# Airbnb Learning Project - 27 Feature Build Tasklist

Status legend: `todo` | `in_progress` | `done` | `mock`

## Phase A - Build for real (Core)

1. `done` Resolution Center workflow baseline
- Incident listing with filters
- Status transitions (open/investigating/resolved/closed)
- Access control for guest/host/admin

2. `done` Search ranking baseline
- Weighted ranking by price, popularity, quality, location hint

3. `done` Booking + cancellation + refund preview hardening
- Pre-booking breakdown and cancellation preview consistency

4. `done` Messaging depth
- Attachment validation and message metadata cleanup

5. `done` Wishlist collaboration hardening
- Role-based collaborator permissions and conflict handling

6. `done` Safety escalation flow hardening
- Structured emergency ticket steps and escalation state

7. `done` Co-host permissions and split guardrails
- Permission matrix checks + payout split validation

8. `done` Loyalty summary logic hardening
- Tier thresholds and benefits mapping

9. `done` Payments flow baseline hardening
- Payment state transitions and idempotent completion

10. `done` Analytics dashboards baseline
- Booking/revenue/conversion snapshots

## Phase B - Learning mocks (API + UI + fake data)

11. `done` Identity verification orchestration (mock)
12. `done` Reservation risk screening (mock)
13. `done` Guaranteed rebooking flow (mock)
14. `done` Chargeback lifecycle (mock)
15. `done` Tax and invoice compliance (mock)
16. `done` Multi-currency settlement (mock)
17. `done` Safety ops routing console (mock)
18. `done` Host insurance claim adjudication (mock)
19. `done` Guest AirCover case board (mock)
20. `done` Off-platform fee detection workflow (mock)
21. `done` Travel disruption policy simulator (mock)

## Phase C - Later scale features

22. `done` Experiences marketplace vertical
23. `done` Services marketplace vertical
24. `done` Cross-vertical recommendations
25. `done` Experiment framework for ranking
26. `done` Compliance automation and audit exports
27. `done` Ops dashboards for support/safety SLA

## Execution order

- Work strictly top-to-bottom.
- Move only one item to `in_progress` at a time.
- For each item: implement -> add/update tests -> run lint/tests -> mark status.
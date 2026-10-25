# EARS — bad → good

Examples on a made-up feature, "refunds for an order" (orders / refunds).

## Vague word
- ✗ "The refunds list should load fast."
- ✓ **NFR1** Latency: `GET /orders/:id/refunds` for ≤ 20 records
  responds in ≤ 300 ms p95 on seed data — verification: `[it]` with a timer.

## Two behaviours in one AC
- ✗ "WHEN the user clicks Approve, the system saves the status and shows Undo."
- ✓ **AC3** (event, US2) WHEN the user clicks Approve on a refund card, the API
  shall save `status = approved`. `[it]`
- ✓ **AC4** (event, US2) WHEN the API has confirmed Approve, the UI shall
  show an "Approved" badge and an Undo button on the card. `[unit]`

## Missing unwanted pair
- ✗ only "WHEN the user creates a refund, the API shall return 202."
- ✓ + **AC6** (unwanted, US1) IF the order is not paid yet, THEN the API
  shall return 409 `order_not_paid`, and the UI shall show an explanation with
  a link to the payment page. `[unit]`

## Describing code instead of behaviour
- ✗ "`RefundService.create()` calls `payments.getCharge()`."
- ✓ **AC2** (ubiquitous, US1) The system shall allow a refund
  only for an amount ≤ what was paid for the order minus what was already refunded. `[unit]`

## State
- ✓ **AC7** (state, US1) WHILE a refund has status `processing`, the UI
  shall show progress and disable the Retry button with the hint
  "Refund in progress". `[unit]` `[e2e]`

## Option
- ✓ **AC9** (optional, US3) WHERE partial refunds are enabled for the shop,
  the system shall accept an amount lower than the full one. `[unit]`

## Combination
- ✓ **AC10** (complex, US1) WHILE a refund has been `processing` for more than 10 min, WHEN
  a new request for the same order arrives, the API shall mark
  the old refund `failed` and accept the new request with 202. `[it]`

## LLM-dependent behaviour
- ✗ "e2e: the model classifies the refund reason as "damaged"."
- ✓ **AC5** (unwanted, US1) IF the model returns a category outside
  `damaged | wrong_item | other`, THEN the system shall save
  `other`. `[unit]` with a mock provider.

# M5 to M2 Contract: Batch Safety Action

Only M2 changes a batch's status. M5 calls `applySafetyAction`
(see `backend/src/services/batchSafety.contract.ts`).

## Request
`pharmacyId`, `batchId`, `action` (BLOCK | QUARANTINE | RELEASE), `reason`,
`safetyNoticeId`, `requestedBy`, `idempotencyKey`

## What M2 sets
| Action | batchStatus | safetyStatus | M5 stores in `actionTaken` |
|---|---|---|---|
| BLOCK | BLOCKED | MATCHED | BLOCKED |
| QUARANTINE | QUARANTINED | MATCHED | QUARANTINED |
| RELEASE | ACTIVE (EXPIRED or DEPLETED stay unchanged) | RESOLVED | RELEASED |

## Rules
1. M5 only calls M2 for notices with `verificationStatus` VERIFIED.
2. M2 checks the batch belongs to `pharmacyId`, otherwise CROSS_PHARMACY_ACCESS.
3. The call is idempotent: the same `idempotencyKey` changes nothing the second time (`changed: false`).
4. M2 refreshes the `publicAvailabilitySnapshot` after a status change.
5. No stock quantity changes, so no `stockMovements` entry is needed.
6. BLOCKED and QUARANTINED batches are not saleable.
7. Errors: BATCH_NOT_FOUND, CROSS_PHARMACY_ACCESS, INVALID_TRANSITION.

## Open questions for M2
- Can RELEASE move a batch to ACTIVE when it is already past expiry?
- Is the function name `applySafetyAction` acceptable?
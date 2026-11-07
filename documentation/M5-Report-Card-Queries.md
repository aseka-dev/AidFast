# M5 Report Card Queries (draft)

All queries are scoped by `pharmacyId` from the login token, never from the client.
"Today" means the pharmacy's local business date (`pharmacySettings.timezone`).

| Card | Collection | Query |
|---|---|---|
| Total medicines | `pharmacyMedicines` | count where `pharmacyId` and `status` = ACTIVE |
| Total stock quantity | `batches` | sum `currentQuantity` where `pharmacyId`, `batchStatus` = ACTIVE and `expiryDate` >= today |
| Low-stock medicines | `batches` + `pharmacyMedicines` | group batches by `medicineId` (sum of saleable `currentQuantity`), count medicines where 0 < sum <= `minimumStockLevel` (fallback `lowStockThreshold`) |
| Out-of-stock medicines | same | count ACTIVE medicines where saleable sum = 0 |
| Expired batches | `batches` | count where `expiryDate` < today |
| Expiring: CRITICAL | `batches` | `expiryDate` within 6 calendar months |
| Expiring: WARNING | `batches` | more than 6, up to 9 calendar months |
| Expiring: ALERT | `batches` | more than 9, up to 12 calendar months |
| Open critical alerts | `alerts` | count where `pharmacyId`, `status` = OPEN, `alertLevel` = CRITICAL |
| Community demand | `requestRecipients` + `medicineAvailabilityRequests` | requests routed to this pharmacy, grouped by `requestStatus` |
| Verified safety notices | `safetyNotices` | count where `verificationStatus` = VERIFIED (shared, no `pharmacyId`) |
| Confirmed safety matches | `safetyNoticeMatches` | count where `pharmacyId` and `matchStatus` = CONFIRMED |
| Sales summary | `sales` | pending: `Sale` has no `pharmacyId` yet (M4) |

Saleable stock = ACTIVE batches, not expired, not BLOCKED or QUARANTINED.
Expiry bands use calendar months, with thresholds from `pharmacySettings.expiryAlertMonths` ([12, 9, 6]).

# M5 Report Card Queries (draft)

All queries are scoped by `pharmacyId` from the login token, never from the client.
"Today" means the pharmacy's local business date (`pharmacySettings.timezone`).
Saleable stock = ACTIVE batches that are not expired, BLOCKED or QUARANTINED.

## Dashboard Overview
| Card or panel | Source | Query |
|---|---|---|
| Low Stock (38) | `batches`, `pharmacyMedicines` | per medicine, sum saleable `currentQuantity`; count where 0 < sum <= `minimumStockLevel` (fallback `lowStockThreshold`) |
| "6 newly flagged" | `alerts` | count `LOW_STOCK` alerts created since yesterday (period to confirm) |
| Critical Expiry (11 batches) | `batches` | count batches with `expiryDate` within 6 calendar months, not yet expired |
| Safety Alerts (4) | `safetyNoticeMatches` | count where `pharmacyId`, `actionTaken` = NONE and `matchStatus` in POTENTIAL, CONFIRMED |
| "2 require review" | `safetyNoticeMatches` | same, `matchStatus` = POTENTIAL |
| Community Demand (23) | `requestRecipients`, `medicineAvailabilityRequests` | requests routed to this pharmacy that are still open this week (needs M6) |
| Stock Status donut | `batches`, `pharmacyMedicines` | per ACTIVE medicine: Out of Stock (saleable 0), Low Stock, Blocked / Quarantined (stock exists but none saleable), else In Stock; show as % of total medicines |
| Recent Alerts | `alerts` | latest 4 by `createdAt`, plus a demand-spike item from M6's summary |
| Recent Stock Movement | `stockMovements` | latest 5: `movementType`, `quantityDelta`, batch number, `performedBy`, `occurredAt`, joined to medicine, brand and user |
| Community Demand list | `medicineAvailabilityRequests` | group by medicine over the last 7 days, count, latest `submittedAt` (needs M6) |

## Expiry & Stock Alerts
| Card | Query |
|---|---|
| Expiry Alert / Warning / Critical | batches with `currentQuantity` > 0 in the 12 / 9 / 6 month bands |
| Expired | batches with `expiryDate` before today and `currentQuantity` > 0 |
| Low Stock / Out of Stock | as above, saleable sum vs `minimumStockLevel`, or zero |

## Reports (Day 14)
Sales summary is pending: `Sale` has no `pharmacyId` yet (M4).
# M5 Contracts and Workflows (for approval)

Owner: Member 5 (Dashboard & Safety Management)
Status: Draft for approval by M1, M2 and M6

## 1. Expiry workflow
1. A daily job, and a run after GRN confirmation or stock changes, reads each pharmacy's thresholds from `pharmacySettings.expiryAlertMonths` (default 12, 9, 6).
2. For every batch with `currentQuantity` > 0, compute the months to expiry in calendar months, using the pharmacy timezone.
3. Category: expired is CRITICAL with `expiryCategory` EXPIRED. 6 months or less is CRITICAL. Over 6 up to 9 is WARNING. Over 9 up to 12 is ALERT. Over 12 months creates no alert.
4. `dedupeKey` is `EXPIRY:{batchId}:{category}`, so a rerun never duplicates an alert. When a batch moves to a new category, the old alert is RESOLVED and a new one is created.
5. M5 never changes batch status. M2 excludes expired stock from saleable stock.
6. Low and out-of-stock alerts compare saleable stock with `minimumStockLevel` (fallback `lowStockThreshold`). `dedupeKey` is `LOW_STOCK:{medicineId}` or `OUT_OF_STOCK:{medicineId}`. They resolve when stock is replenished.
7. Alert status: OPEN ("Requires Review"), then ACKNOWLEDGED ("Mark as Reviewed", recorded with `acknowledgedBy` and `acknowledgedAt`), then RESOLVED (batch depleted, returned, or no longer in the band). CRITICAL alerts stay in the banner until acknowledged.
8. A CRITICAL alert creates a `Notification` for pharmacy users who have the `alerts:read` permission.

## 2. Safety workflow
1. A notice is entered from a human-verified source: type, reference number, source, source URL, notice date, description, medicine and affected batch numbers.
2. Only notices with `verificationStatus` VERIFIED are matched.
3. Matching runs per pharmacy. A batch matches when its `medicineId` equals the notice's `medicineId` and its `batchNumber` is in `affectedBatchNumbers`. Batch numbers are not globally unique, so always match medicine and batch number together. Each match creates a `SafetyNoticeMatch` (POTENTIAL).
4. A match creates a CRITICAL `RECALL_MATCH` alert and a notification.
5. A user then chooses Block or Quarantine, which calls M2's `applySafetyAction` to set the batch status, or Dismiss. Release returns the batch to ACTIVE and sets the match to RESOLVED. See `M5-Block-Quarantine-Contract.md`.
6. The status shown on the Safety Notices screen is derived:

| Screen status | Rule |
|---|---|
| Open | Notice VERIFIED, matching not run yet |
| Matched | Match POTENTIAL or CONFIRMED |
| No Match | Matching ran and this pharmacy has no batch with that medicine and batch number |
| Resolved | Match RESOLVED |

## 3. Alert DTO
```json
{
  "id": "string",
  "alertType": "EXPIRY",
  "alertLevel": "CRITICAL",
  "expiryCategory": "ALERT | WARNING | CRITICAL | EXPIRED",
  "status": "OPEN | ACKNOWLEDGED | RESOLVED",
  "message": "string",
  "medicineId": "string",
  "medicineName": "string",
  "brandTradeName": "string",
  "batchId": "string",
  "batchNumber": "string",
  "expiryDate": "2026-10-18T00:00:00.000Z",
  "monthsToExpiry": 0.6,
  "quantity": 22,
  "unitOfMeasure": "pens",
  "distributor": { "supplierId": "string", "name": "string" },
  "linkedGrn": { "grnId": "string", "grnNumber": "string" },
  "createdAt": "string",
  "acknowledgedAt": "string",
  "acknowledgedBy": "string"
}
```
List: `GET /api/v1/pharmacies/:pharmacyId/alerts?tab=expiry|low|out&level=&medicineId=&period=&page=&pageSize=` returns `{ items, page, pageSize, total }`.
Summary: `GET /api/v1/pharmacies/:pharmacyId/alerts/summary` returns `{ expiryAlert, expiryWarning, criticalExpiry, expired, lowStock, outOfStock }`.
Distributor and linked GRN come from the batch's `grnItemId`, then the GRN, then the supplier.

## 4. Safety notice row DTO
```json
{
  "noticeId": "string",
  "matchId": "string or null",
  "referenceNumber": "string",
  "noticeDate": "string",
  "medicineName": "string",
  "brandTradeName": "string",
  "manufacturer": "string",
  "batchNumber": "string",
  "displayStatus": "OPEN | MATCHED | NO_MATCH | RESOLVED",
  "inventoryMatch": { "quantity": 46, "unit": "tablets" },
  "actionTaken": "NONE | BLOCKED | QUARANTINED | RELEASED"
}
```
One row per notice and affected batch number. `inventoryMatch` is null when matching has not run.

## 5. Reports DTO
```json
{
  "pharmacyId": "string",
  "period": { "from": "2026-10-01", "to": "2026-10-31" },
  "sales": { "totalAmount": "0.00", "totalTransactions": 0 },
  "stock": { "totalMedicines": 0, "totalQuantity": 0, "lowStock": 0, "outOfStock": 0 },
  "expiry": { "expired": 0, "critical": 0, "warning": 0, "alert": 0 },
  "communityDemand": { "totalRequests": 0, "byStatus": {} },
  "safety": { "verifiedNotices": 0, "confirmedMatches": 0 }
}
```
Money values are strings, because the database stores Decimal128. The sales block waits for M4 to add `pharmacyId` to `Sale`.

## 6. Demand aggregation (needed from M6)
`GET /api/v1/pharmacies/:pharmacyId/community-demand/summary?from=&to=`
```json
{
  "activeRequests": 23,
  "addedThisWeek": 7,
  "byStatus": { "SUBMITTED": 0, "ROUTED": 0, "RESPONSES_RECEIVED": 0, "CLOSED": 0 },
  "topMedicines": [
    { "medicineName": "string", "requestCount": 18, "lastRequestedAt": "string" }
  ]
}
```
Rules: results are scoped to this pharmacy through `requestRecipients`. The response contains counts only, with no phone numbers or tracking tokens. The Figma screens show request counts, so no quantity field is needed.

## 7. Approval
- [ ] M1 (integration lead): permissions, tenant check, overall contract
- [ ] M2: batch fields and `applySafetyAction`
- [ ] M6: community demand summary
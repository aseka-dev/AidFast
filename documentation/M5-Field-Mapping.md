
# Dashboard & Safety Management
## Field Mapping Document

### 1. Dashboard Overview

| Required information | Possible data source | Purpose |
|---|---|---|
| Total medicines | Medicine records | Display total medicines |
| Total stock quantity | Medicine and batch records | Display available stock |
| Low-stock medicines | Medicine and batch records | Identify medicines with low stock |
| Expiring batches | Batch records | Display batches nearing expiry |
| Critical alerts | Alerts | Display important warnings |

### 2. Expiry & Stock Alerts

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Medicine records | Identify the medicine |
| Batch number | Batch records | Identify the batch |
| Expiry date | Batch records | Check expiry |
| Available quantity | Batch records | Check remaining stock |
| Alert level | Alerts | Show alert severity |
| Alert status | Alerts | Show whether the alert is active or resolved |

### 3. Community Demand

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Availability requests | Identify requested medicine |
| Requested quantity | Availability requests | Understand demand |
| Request date | Availability requests | Track when requests were made |
| Requested area | Availability requests | Identify demand by area |

### 4. Safety Notices

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Safety notices | Identify affected medicine |
| Notice title | Safety notices | Display notice |
| Notice description | Safety notices | Explain the safety issue |
| Verification status | Safety notices | Show whether notice is verified |
| Matched batch | Batch records / notice matches | Identify affected batches |
| Notification status | Notifications | Track sent notifications |

### 5. Add Verified Medicine Safety Notice

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name or ID | Medicine records | Identify medicine |
| Notice title | Safety notices | Store notice title |
| Notice type | Safety notices | Categorize the notice |
| Description | Safety notices | Explain the issue |
| Source reference | Safety notices | Record the information source |
| Verification status | Safety notices | Track verification |

### 6. Reports

| Required information | Possible data source | Purpose |
|---|---|---|
| Total medicines | Medicine records | Medicine summary |
| Low-stock count | Medicine and batch records | Stock summary |
| Expiring batch count | Batch records | Expiry summary |
| Expired batch count | Batch records | Expired stock summary |
| Critical alert count | Alerts | Safety summary |
| Community demand | Availability requests | Demand summary |


## 7. Collection mapping (per Database Design Specification v1.1)

| Screen | Collections read | Owner | M5 writes? |
|---|---|---|---|
| Overview | `medicineCatalog`, `pharmacyMedicines`, `batches`, `sales` | M2, M4 | No |
| Alerts | `batches`, `pharmacyMedicines`, `pharmacySettings` | M2, M1 | No |
| Alerts | `alerts`, `notifications` | M5 | Yes |
| Community Demand | `medicineAvailabilityRequests`, `requestRecipients`, `pharmacyRequestResponses` | M6 | No |
| Safety | `safetyNotices`, `safetyNoticeMatches` | M5 | Yes |
| Reports | all of the above | M2, M4, M5, M6 | No |

## 8. Field matrix (M5-owned collections)

### alerts
| Field | Type | Notes |
|---|---|---|
| `pharmacyId` | ObjectId | required |
| `medicineId` | ObjectId | ref `medicineCatalog` |
| `batchId` | ObjectId | ref `batches` |
| `alertType` | Enum | LOW_STOCK, OUT_OF_STOCK, EXPIRY, RECALL_MATCH |
| `alertLevel` | Enum | INFO, ALERT, WARNING, CRITICAL |
| `message` | String | |
| `status` | Enum | OPEN, ACKNOWLEDGED, RESOLVED |
| `dedupeKey` | String | unique with `pharmacyId` |
| `resolvedAt` | Date | |

### safetyNotices (shared, no pharmacyId)
| Field | Type | Notes |
|---|---|---|
| `noticeType` | Enum | RECALL, REVOCATION, OTHER |
| `referenceNumber` | String | |
| `source`, `sourceUrl` | String | |
| `noticeDate` | Date | |
| `description` | String | |
| `affectedBatchNumbers` | String[] | |
| `verificationStatus` | Enum | PENDING, VERIFIED, REJECTED |
| `medicineId` | ObjectId | ref `medicineCatalog` |
| `verifiedBy`, `verifiedAt` | ObjectId, Date | |

### safetyNoticeMatches
| Field | Type | Notes |
|---|---|---|
| `pharmacyId` | ObjectId | required |
| `safetyNoticeId` | ObjectId | ref `safetyNotices` |
| `batchId` | ObjectId | ref `batches` |
| `matchStatus` | Enum | POTENTIAL, CONFIRMED, DISMISSED, RESOLVED |
| `actionTaken` | Enum | NONE, BLOCKED, QUARANTINED, RELEASED |
| `matchedAt`, `actionAt` | Date | |
| `actionTakenBy` | ObjectId | ref `users` |
| `reason` | String | |

### notifications (internal only)
| Field | Type | Notes |
|---|---|---|
| `pharmacyId`, `userId`, `alertId` | ObjectId | |
| `title`, `message`, `notificationType` | String | |
| `isRead` | Boolean | |

### Fields I read from other members (pending confirmation)
| Field | Collection | Owner |
|---|---|---|
| `batchNumber`, `expiryDate`, `currentQuantity`, `batchStatus`, `safetyStatus` | `batches` | M2 |
| `minimumStockLevel`, `status` | `pharmacyMedicines` | M2 |
| `medicineName` | `medicineCatalog` | M2 |
| `expiryAlertMonths` (Number[], default [12, 9, 6]), `lowStockThreshold` (default 10) | `pharmacySettings` | M1 (differs from spec: spec has 3 separate fields) |
| `saleDate`, `totalAmount`, `netAmount`, `status` (`completed`/`cancelled`) | `sales` | M4 (no `pharmacyId` yet; differs from spec) |
| `requestStatus`, `preferredTownArea`, `submittedAt` | `medicineAvailabilityRequests` | M6 |

## 9. Expiry rules (calendar months, thresholds from `pharmacySettings`)

| Months to expiry | Result |
|---|---|
| Date already passed | Expired |
| 6 or less | CRITICAL |
| More than 6, up to 9 | WARNING |
| More than 9, up to 12 | ALERT |
| More than 12 | Normal |

## 10. Alert DTO (draft)

```json
{
  "id": "string",
  "alertType": "EXPIRY",
  "alertLevel": "CRITICAL",
  "message": "string",
  "status": "OPEN",
  "medicineId": "string",
  "medicineName": "string",
  "batchId": "string",
  "batchNumber": "string",
  "expiryDate": "2027-06-30T00:00:00.000Z",
  "monthsToExpiry": 5,
  "createdAt": "2026-11-02T00:00:00.000Z"
}
```

## 11. Reports DTO (draft)

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

Money values are sent as strings because the database stores them as Decimal128.

## 12. Pending confirmation

- [x] M1: model names confirmed from code (`Pharmacy`, `User`, `PharmacySetting`); `pharmacyId` is used as the pharmacy reference
- [ ] M1: spec has `expiryAlertMonths`, `expiryWarningMonths`, `expiryCriticalMonths`; code has one array (`expiryAlertMonths: [12, 9, 6]`). Which wins?
- [ ] M2: `batches`, `pharmacyMedicines` and `medicineCatalog` fields and model names (not merged yet)
- [x] M4: `Sale` model checked in `backend/src/modules/sales/models`
- [ ] M4: `Sale` has no `pharmacyId`; status values are lowercase (`completed`/`cancelled`), not DRAFT/COMPLETED/VOIDED
- [ ] M6: request collections, and whether a requested-quantity field will exist
- [ ] Team: does `safetyNotices` need a `title` field?
- [ ] Stakeholder: who verifies safety notices; low-availability threshold
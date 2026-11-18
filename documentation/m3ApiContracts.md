# S1-D3-M3 – Supplier and GRN API Contracts

## Base URLs

Suppliers:
`/api/v1/pharmacies/:pharmacyId/suppliers`

GRNs:
`/api/v1/pharmacies/:pharmacyId/grns`

All endpoints require authentication and authorized
membership in the selected pharmacy.

## Supplier Endpoints

GET    /                 - List suppliers
GET    /:id              - Get supplier details
POST   /                 - Create supplier
PUT    /:id              - Update supplier
PATCH  /:id/deactivate   - Deactivate supplier

## GRN Endpoints

GET    /                    - List GRNs (optional `?status=DRAFT`; pending queue requires `grn:verify`)
GET    /:id                 - Get GRN details
POST   /                    - Create GRN draft
PUT    /:id                 - Replace an existing DRAFT or CHANGES_REQUESTED GRN and its items
PATCH  /:id                 - Replace an existing DRAFT or CHANGES_REQUESTED GRN and its items
POST   /:id/submit          - Submit DRAFT or resubmit CHANGES_REQUESTED
POST   /:id/request-changes - Request corrections for a pending GRN
POST   /:id/confirm         - Confirm a pending GRN and post accepted stock
POST   /:id/reverse         - Reverse GRN (reserved; not implemented)

Draft create and edit requests include `supplierId`, `invoiceNumber`,
`receivedDate`, and a non-empty `items` array. Each item requires `medicineId`,
`batchNumber`, `expiryDate`, and nonnegative whole-number `receivedQuantity`.
Optional `invoiceDate`, `purchaseOrderId`, and `purchaseOrderItemId` values are
validated against the selected pharmacy and supplier. When omitted,
`grnNumber` is generated as `GRN-YYYYMMDD-<16 uppercase hexadecimal characters>`;
an existing number is preserved when a draft edit omits it.

Accepted quantity is always calculated as `receivedQuantity -
rejectedQuantity`; clients cannot override it. Draft updates replace the full
item list atomically and are allowed only while the GRN is `DRAFT` or
`CHANGES_REQUESTED`. STAFF may edit only their own GRNs. Create, edit, submit,
and confirmation require MongoDB transaction support.

## Permissions

Submit:
- Permission: `grn:submit`
- From: DRAFT
- To: PENDING_VERIFICATION

Request Changes:
- Permission: `grn:verify`
- From: PENDING_VERIFICATION
- To: CHANGES_REQUESTED
- Body: `{ "comment": "..." }`; trimmed comment must contain at least 5 characters.
- Records verifier, time, comment and audit history; never posts inventory.

Confirm:
- Permission: `grn:confirm`
- From: PENDING_VERIFICATION
- To: CONFIRMED
- VERIFIER and ADMIN have `grn:confirm`; PHARMACIST and STAFF do not.
- GRN creator cannot verify their own receipt.
- Status, batch creation, stock movements and balances commit in one MongoDB
  transaction. Only accepted quantities are posted; stable per-item idempotency
  keys and `inventoryPosted` prevent duplicate posting.

Resubmit:
- Permission: `grn:submit`
- From: CHANGES_REQUESTED
- To: PENDING_VERIFICATION
- Server reruns supplier, purchase order, pharmacy medicine, quantity, and
  financial validations. Resubmission does not post inventory.

Reverse:
- Permission: `grn:reverse`
- From: CONFIRMED
- To: REVERSED
- Compensating stock movements required

Read, create, update and submit operations use `grn:read`, `grn:create`, and
`grn:submit` respectively, together with authenticated selected-pharmacy
membership and URL pharmacy matching. Draft creation, editing and submission
do not modify inventory. Invalid transitions return HTTP 409, malformed input
returns 400, missing GRNs return 404, and access failures return 403. MongoDB
must run as a replica set or through mongos for transactional operations;
standalone MongoDB returns 503.

## Supplier Response

HTTP 200

{
  "success": true,
  "message": "Supplier retrieved successfully",
  "data": {
    "_id": "supplierObjectId",
    "supplierName": "Example Distributor",
    "contact": "0770000000",
    "email": "example@example.com",
    "address": "Colombo",
    "status": "ACTIVE"
  }
}

## GRN Response

HTTP 200

{
  "success": true,
  "message": "GRN retrieved successfully",
  "data": {
    "_id": "grnObjectId",
    "grnNumber": "GRN-001",
    "supplierId": "supplierObjectId",
    "purchaseOrderId": "purchaseOrderObjectId",
    "status": "DRAFT",
    "inventoryPosted": false,
    "items": []
  }
}

## Submit Response

HTTP 200

{
  "success": true,
  "message": "GRN submitted for verification",
  "data": {
    "_id": "grnObjectId",
    "status": "PENDING_VERIFICATION"
  }
}

## Confirm Response

HTTP 200

{
  "success": true,
  "message": "GRN confirmed successfully",
  "data": {
    "_id": "grnObjectId",
    "status": "CONFIRMED",
    "inventoryPosted": true
  }
}

## Reverse Response

HTTP 200

{
  "success": true,
  "message": "GRN reversed successfully",
  "data": {
    "_id": "grnObjectId",
    "status": "REVERSED",
    "inventoryPosted": false
  }
}

The reversal preserves original stock movements
and records compensating movements.

## Error Response

{
  "success": false,
  "message": "Operation not permitted",
  "error": {
    "code": "FORBIDDEN"
  }
}

## HTTP Status Codes

200 - Successful request
201 - Resource created
400 - Invalid input
401 - Authentication required
403 - Permission denied
404 - Resource not found
409 - Invalid state transition
422 - Business validation failed
503 - MongoDB transaction support unavailable
500 - Internal server error
501 - Endpoint not implemented

## Security Rules

- Validate JWT authentication.
- Verify pharmacy membership.
- Check permissions for each operation.
- Do not trust client-supplied pharmacyId.
- Only confirmed GRNs post inventory.
- Prevent duplicate stock posting.
- Reverse using compensating stock movements.
- Preserve audit history.

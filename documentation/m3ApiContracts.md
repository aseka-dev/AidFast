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

GET    /                    - List GRNs (optional `?status=DRAFT`)
GET    /:id                 - Get GRN details
POST   /                    - Create GRN draft
PUT    /:id                 - Replace an existing DRAFT and its items
PATCH  /:id                 - Replace an existing DRAFT and its items
POST   /:id/submit          - Submit a DRAFT for verification
POST   /:id/request-changes - Request corrections (reserved; not implemented)
POST   /:id/confirm         - Confirm GRN (reserved; not implemented)
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
item list atomically and are allowed only while the GRN remains `DRAFT`.
Create, edit, and submit require MongoDB transaction support.

## Permissions

Submit:
- Permission: `grn:submit`
- From: DRAFT
- To: PENDING_VERIFICATION

Request Changes:
- Permission: `grn:verify`
- From: PENDING_VERIFICATION
- To: CHANGES_REQUESTED

Confirm:
- Permission: `grn:confirm`
- From: PENDING_VERIFICATION
- To: CONFIRMED
- Stock posting required exactly once

Reverse:
- Permission: `grn:reverse`
- From: CONFIRMED
- To: REVERSED
- Compensating stock movements required

Read, create, update and submit operations use `grn:read`, `grn:create`, and
`grn:submit` respectively, together with authenticated selected-pharmacy
membership and URL pharmacy matching. Draft creation, editing and submission
do not modify inventory.

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

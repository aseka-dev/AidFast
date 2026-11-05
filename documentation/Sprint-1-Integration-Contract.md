# AidFast — Sprint 1 Approved Integration Contract
**IS5109 Community Project | Group 08 | 6 Members | Sprint 1 Review & Baseline Gate**  
**Author / Platform Owner:** Member 1 (Platform, Authentication & Infrastructure)  
**Date:** November 2026  
**Status:** APPROVED & FROZEN

---

## 1. Executive Summary & Release Gate Status
Sprint 1 establishes the multi-tenant architectural foundation, API contracts, database schemas, and shared frontend navigation shell for AidFast.

* **Release Gate:** Shared API contract and runnable app baseline.
* **Sprint 1 Outcome:** All 36 Figma screens/states mapped, multi-tenant authentication active, roles and permissions frozen, backend API scaffolding mounted, and shared dashboard navigation live.

---

## 2. Monorepo Architecture & Runnable Baseline

| Layer | Technology | Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 | Public Community Portal and Pharmacy Dashboard SPA |
| **Backend** | Express 5, Node.js, TypeScript | REST API, multi-tenant middleware, audit logging |
| **Database** | MongoDB with Mongoose | Shared multi-tenant database with tenant isolation |
| **CI / DevOps** | GitHub Actions (`.github/workflows/ci.yml`) | Automated build, typecheck (`tsc`), and lint on every PR |

---

## 3. Non-Negotiable Architecture & Tenancy Rules

1. **Shared Database & Mandatory `pharmacyId`:**
   * One shared MongoDB database.
   * Every pharmacy-owned collection (`pharmacyMedicines`, `batches`, `stockMovements`, `grns`, `sales`, `returns`, `pharmacySettings`) **MUST** require `pharmacyId: ObjectId`.
2. **Never Trust Client-Supplied `pharmacyId`:**
   * Server validates pharmacy membership and permissions using `authenticate` and `requireSelectedPharmacy` middleware.
   * Client-supplied `pharmacyId` in query strings or bodies is never treated as authorization.
3. **Naming & Timezone Standard:**
   * Field names: `camelCase`.
   * Collection names: plural `lowerCamelCase` (e.g., `pharmacies`, `pharmacyUsers`, `stockMovements`).
   * Foreign keys: `ObjectId` references with `Id` suffix (e.g., `userId`, `pharmacyId`, `batchId`).
   * Timestamps: `createdAt` and `updatedAt` stored in UTC.
   * Exact field name requirements: `brandTradeName` and `preferredBrandTradeName`.

---

## 4. Finalized Permissions & Role Matrix

Defined in `backend/src/config/permissions.ts` and enforced via `requirePermission(perm)`:

### Role Permissions

| Role | Intended User | Assigned Permissions |
| :--- | :--- | :--- |
| **`ADMIN`** | Pharmacy Owner / Super Administrator | `['*']` (Wildcard access to all platform and pharmacy operations) |
| **`PHARMACIST`** | Licensed Pharmacist | `users:read`, `pharmacy:settings`, `catalog:read`, `catalog:create`, `catalog:update`, `inventory:read`, `inventory:adjust`, `sales:read`, `sales:create`, `returns:read`, `returns:create`, `returns:approve`, `alerts:read`, `safety:read`, `safety:verify`, `reports:read`, `requests:read`, `requests:respond` |
| **`STAFF`** | Dispensing Counter Assistant | `catalog:read`, `inventory:read`, `sales:read`, `sales:create`, `returns:read`, `returns:create`, `requests:read` |
| **`VERIFIER`** | Quality / GRN Verification Officer | `users:read`, `suppliers:read`, `po:read`, `grn:read`, `grn:verify`, `inventory:read`, `safety:read` |

---

## 5. API Contracts & Endpoint Mounts

### Member 1: Platform & Authentication
* `POST /api/auth/login` — Authenticate user and return accessible pharmacies
* `POST /api/auth/select-pharmacy` — Issue tenant-scoped JWT token containing `pharmacyId` and permissions
* `GET  /api/auth/me` — Return active user session and role context
* `POST /api/auth/logout` — Revoke token and log audit event
* `GET  /api/pharmacies/my-pharmacies` — List active pharmacy memberships for current user
* `GET  /api/pharmacies/selected` — Return active pharmacy tenant details
* `GET  /api/settings` & `PUT /api/settings` — Pharmacy settings CRUD (M1)
* `GET  /api/users` & `POST /api/users` — Staff user membership management (M1)

### Member 2: Catalog & Stock Ledger Interface (Contract for M3/M4/M5)
* Central atomic stock ledger service (`stockPosting`):
  * **Stock-In:** Triggered exclusively by M3 upon **CONFIRMED** GRN
  * **Stock-Out (FIFO):** Consumed exclusively by M4 during sales completion
  * **Negative-Stock Prevention:** Balance must never drop below 0
  * **Immutable Movement:** Balance updates create audit records in `stockMovements`

### Member 3: Purchasing & GRN State Machine (Contract for M2/M4)
* States: `DRAFT` $\rightarrow$ `PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` $\rightarrow$ `CONFIRMED`
* Only `CONFIRMED` state calls M2 stock-in
* Source `grnItemId` preserved for M4 distributor returns

### Member 4: Sales, FIFO Allocation & Returns (Contract with M2/M3)
* FIFO allocation order: `receivedDate ASC`, then `_id ASC`
* Expired, blocked, or quarantined stock is strictly non-saleable
* Customer returns default to quarantine; require explicit manager approval for restock

### Member 5: Alerts, Safety Recalls & Reports
* Expiry alert thresholds: Fixed calendar months (12 / 9 / 6 months)
* Safety notices: Human-entered, verified notices matching batches for quarantine

### Member 6: Public Medicine Requests & Community Portal
* Route: `/api/v1/public/medicine-requests`
* Never expose exact quantities, private phone numbers, or wholesale prices
* Area-based routing to eligible pharmacies

---

## 6. Screen Inventory & Frontend Routing Map (36 Screens)

All 36 screens anchor into Member 1's shared shell:

| Route Path | Shell / Layout | Screen / Feature | Owner |
| :--- | :--- | :--- | :---: |
| `/` | `PublicLayout` | Public Community Home | M6 |
| `/find-medicines` | `PublicLayout` | Medicine Search & Availability Cards | M6 |
| `/pharmacies` | `PublicLayout` | Community Pharmacy Directory | M6 |
| `/request-medicine` | `PublicLayout` | Guest Medicine Request Submission | M6 |
| `/track-request` | `PublicLayout` | Secure Request Tracking | M6 |
| `/how-it-works` | `PublicLayout` | Platform Workflow Guide | M6 |
| `/about-us` | `PublicLayout` | About AidFast Healthcare | M6 |
| `/login` | Standalone | NEW Staff Login Screen | M1 |
| `/dashboard` | `DashboardLayout` | Dashboard Overview | M5 |
| `/dashboard/medicines` | `DashboardLayout` | Medicine & Product Catalog | M2 |
| `/dashboard/inventory` | `DashboardLayout` | Batch & Inventory Register | M2 |
| `/dashboard/purchasing`| `DashboardLayout` | GRN Register, POs & Distributors | M3 |
| `/dashboard/transactions` | `DashboardLayout` | Sales, Allocations & Returns | M4 |
| `/dashboard/alerts` | `DashboardLayout` | Expiry & Low Stock Alerts (12/9/6) | M5 |
| `/dashboard/community-demand` | `DashboardLayout` | Community Request Responses | M5/M6 |
| `/dashboard/safety-notices` | `DashboardLayout` | Safety Recalls & Quarantined Batches | M5 |
| `/dashboard/reports` | `DashboardLayout` | Pharmacy Analytics & Audit Logs | M5 |
| `/dashboard/settings` | `DashboardLayout` | Pharmacy Settings & Roles | M1 |

---

## 7. No-Clash Rules & Codebase Governance
1. **No direct collection mutation across modules:**
   * Only M2 modifies stock ledger balances persistently. M3, M4, and M5 consume M2 service contracts.
2. **Pull Request Protocol:**
   * All changes must pass GitHub Actions CI (`ci.yml`) before merging.
   * No broken exports or empty controller files.
3. **Sprint 2 Readiness:**
   * All baseline scaffolding is verified, runnable, and type-checked.


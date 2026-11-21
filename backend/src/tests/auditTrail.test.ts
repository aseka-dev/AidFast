import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Routes
import grnRoutes from '../routes/grnRoutes';
import salesRoutes from '../routes/salesRoutes';
import returnsRoutes from '../routes/returnsRoutes';
import safetyRoutes from '../routes/safetyRoutes';

// Models
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import AuditLog from '../models/AuditLog';
import GRN from '../models/Grn';
import GRNItem from '../models/GrnItem';
import Supplier from '../models/Supplier';
import Batch from '../models/Batch';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';

// Services
import { stockPostingService } from '../services/stockPostingService';
import errorHandler from '../middleware/errorHandler';

const newId = () => new mongoose.Types.ObjectId().toString();

// Test fixtures
const JWT_TEST_SECRET = 'aidfast-audit-test-secret-2026';
const pharmacyA = newId();
const pharmacyB = newId();

const adminUserId = newId();
const pharmacistUserId = newId();
const staffUserId = newId();
const verifierUserId = newId();

const adminRoleId = newId();
const pharmacistRoleId = newId();
const staffRoleId = newId();
const verifierRoleId = newId();

// Helper to spawn in-memory test server via named pipe (Windows) or domain socket (Unix)
const createTestServer = async (app: express.Express) => {
    const pipeName = process.platform === 'win32'
        ? `\\\\.\\pipe\\aidfast-aud-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        : `/tmp/aidfast-aud-${Date.now()}-${Math.floor(Math.random() * 100000)}.sock`;

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(pipeName, resolve));

    const request = (
        path: string,
        method = 'GET',
        body?: unknown,
        token?: string | null
    ) => {
        return new Promise<{ status: number; body: any }>((resolve, reject) => {
            const reqHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };

            const req = http.request(
                {
                    socketPath: pipeName,
                    path,
                    method,
                    headers: reqHeaders
                },
                (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        let parsed: any = data;
                        try {
                            parsed = JSON.parse(data);
                        } catch {
                            // keep as raw string
                        }
                        resolve({ status: res.statusCode || 500, body: parsed });
                    });
                }
            );

            req.on('error', reject);

            if (body !== undefined) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    };

    const close = () => new Promise<void>((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve());
    });

    return { request, close };
};

test('AidFast Operational Audit Trail & Access Permissions Suite (Sprint 3 Day 11)', async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = JWT_TEST_SECRET;

    t.after(() => {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    // In-memory collections for model doubles
    const users: any[] = [
        { _id: adminUserId, id: adminUserId, fullName: 'Admin User', email: 'admin@aidfast.lk', isActive: true },
        { _id: pharmacistUserId, id: pharmacistUserId, fullName: 'Pharmacist User', email: 'pharmacist@aidfast.lk', isActive: true },
        { _id: staffUserId, id: staffUserId, fullName: 'Staff User', email: 'staff@aidfast.lk', isActive: true },
        { _id: verifierUserId, id: verifierUserId, fullName: 'Verifier User', email: 'verifier@aidfast.lk', isActive: true }
    ];

    const roles: any[] = [
        { _id: adminRoleId, id: adminRoleId, name: 'ADMIN', permissions: ['*'] },
        {
            _id: pharmacistRoleId,
            id: pharmacistRoleId,
            name: 'PHARMACIST',
            permissions: [
                'grn:read', 'grn:create', 'grn:submit', 'grn:verify', 'grn:confirm',
                'sales:read', 'sales:create',
                'returns:read', 'returns:create', 'returns:approve',
                'safety:read', 'safety:create', 'safety:verify', 'safety:action'
            ]
        },
        {
            _id: staffRoleId,
            id: staffRoleId,
            name: 'STAFF',
            permissions: [
                'grn:read', 'grn:create',
                'sales:read', 'sales:create',
                'returns:read', 'returns:create',
                'safety:read'
            ]
        },
        {
            _id: verifierRoleId,
            id: verifierRoleId,
            name: 'VERIFIER',
            permissions: [
                'grn:read', 'grn:verify', 'grn:confirm',
                'returns:read',
                'safety:read', 'safety:verify', 'safety:action'
            ]
        }
    ];

    const memberships: any[] = [
        { _id: newId(), id: newId(), userId: adminUserId, pharmacyId: pharmacyA, roleId: adminRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: pharmacistUserId, pharmacyId: pharmacyA, roleId: pharmacistRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: staffUserId, pharmacyId: pharmacyA, roleId: staffRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: verifierUserId, pharmacyId: pharmacyA, roleId: verifierRoleId, isActive: true }
    ];

    const auditEvents: any[] = [];
    const grnId = newId();
    const grnItemId = newId();
    const supplierId = newId();
    const medicineId = newId();
    const batchId = newId();

    const grnDoc: any = {
        _id: grnId,
        id: grnId,
        pharmacyId: pharmacyA,
        supplierId,
        grnNumber: 'GRN-20261121-001',
        status: 'PENDING_VERIFICATION',
        receivedDate: new Date(),
        inventoryPosted: false,
        createdBy: staffUserId, // Created by staff, so verifier/pharmacist can confirm
        toObject: function () { return { ...this }; },
        save: async function () { return this; },
        set: function (obj: any) { Object.assign(this, obj); }
    };

    const grnItemDoc: any = {
        _id: grnItemId,
        id: grnItemId,
        pharmacyId: pharmacyA,
        grnId,
        medicineId,
        batchNumber: 'LOT-TEST-1',
        expiryDate: new Date('2028-01-01'),
        receivedQuantity: 10,
        acceptedQuantity: 10,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        returnedQuantity: 0,
        unitOfMeasure: 'unit',
        wholesalePrice: mongoose.Types.Decimal128.fromString('10.00'),
        retailPrice: mongoose.Types.Decimal128.fromString('15.00'),
        toObject: function () { return { ...this }; },
        save: async function () { return this; }
    };

    // Query helper supporting Mongoose chainable methods
    const makeDocQuery = (val: any) => {
        let current = val;
        const q: any = Promise.resolve(current);
        q.select = () => makeDocQuery(current);
        q.sort = () => makeDocQuery(current);
        q.session = () => makeDocQuery(current);
        q.populate = () => makeDocQuery(current);
        return q;
    };

    // Model Doubles
    t.mock.method(User, 'findById', (id: any) => {
        const searchId = id && typeof id === 'object' ? (id._id || id.id) : id;
        const user = users.find(u => String(u._id) === String(searchId) || String(u.id) === String(searchId));
        return makeDocQuery(user || null);
    });

    t.mock.method(Pharmacy, 'findOne', () => makeDocQuery({
        _id: pharmacyA,
        id: pharmacyA,
        name: 'Greenway Community Pharmacy',
        status: 'ACTIVE'
    }));

    t.mock.method(PharmacyUser, 'findOne', (filter: any) => {
        const membership = memberships.find(m => {
            if (filter?._id && String(m._id) !== String(filter._id)) return false;
            if (filter?.userId && String(m.userId) !== String(filter.userId)) return false;
            if (filter?.pharmacyId && String(m.pharmacyId) !== String(filter.pharmacyId)) return false;
            if (filter?.isActive !== undefined && m.isActive !== filter.isActive) return false;
            return true;
        });

        if (membership) {
            return makeDocQuery({
                ...membership,
                save: async function () { return this; }
            });
        }
        return makeDocQuery(null);
    });

    t.mock.method(Role, 'findById', (id: any) => {
        const searchId = id && typeof id === 'object' ? (id._id || id.id) : id;
        const role = roles.find(r => String(r._id) === String(searchId) || String(r.id) === String(searchId));
        return makeDocQuery(role || null);
    });

    t.mock.method(AuditLog, 'create', async (data: any) => {
        auditEvents.push({ ...data, createdAt: new Date() });
        return { _id: newId(), id: newId(), ...data };
    });

    // Mongoose transaction mock
    t.mock.method(mongoose, 'startSession', async () => ({
        withTransaction: async (cb: () => Promise<void>) => { await cb(); },
        endSession: async () => {}
    }));

    // GRN model doubles
    t.mock.method(GRN, 'findOne', (filter: any) => {
        if (filter?._id && String(filter._id) === String(grnId)) {
            return makeDocQuery(grnDoc);
        }
        return makeDocQuery(null);
    });

    t.mock.method(GRN, 'exists', () => makeDocQuery(true));

    t.mock.method(GRN, 'findOneAndUpdate', (filter: any, update: any) => {
        if (filter?._id && String(filter._id) === String(grnId)) {
            Object.assign(grnDoc, update?.$set);
            return makeDocQuery(grnDoc);
        }
        return makeDocQuery(null);
    });

    t.mock.method(GRNItem, 'find', () => makeDocQuery([grnItemDoc]));

    t.mock.method(Supplier, 'findOne', () => makeDocQuery({ _id: supplierId, status: 'ACTIVE' }));

    t.mock.method(Batch, 'findOneAndUpdate', () => makeDocQuery({
        _id: batchId,
        id: batchId,
        batchNumber: 'LOT-TEST-1',
        currentQuantity: 10,
        batchStatus: 'ACTIVE',
        safetyStatus: 'CLEAR'
    }));

    t.mock.method(stockPostingService, 'post', async () => ({
        movementId: newId(),
        batchId,
        quantityBefore: 0,
        quantityAfter: 10,
        applied: true,
        batchStatus: 'ACTIVE'
    }));

    // Sales model doubles
    t.mock.method(Sale, 'create', async (docs: any[]) => {
        return docs.map(doc => ({
            _id: newId(),
            id: newId(),
            saleNumber: `SALE-${Date.now()}`,
            ...doc
        }));
    });

    t.mock.method(SaleItem, 'insertMany', async (items: any[]) => {
        return items.map(item => ({
            _id: newId(),
            id: newId(),
            ...item
        }));
    });

    t.mock.method(Sale.prototype, 'save', async function (this: any) {
        this._id = this._id || newId();
        this.saleNumber = this.saleNumber || `SAL-${Date.now()}`;
        return this;
    });

    t.mock.method(SaleItem.prototype, 'save', async function (this: any) {
        return this;
    });

    // Build Express application
    const app = express();
    app.use(express.json());

    app.use('/api/v1/pharmacies/:pharmacyId/grns', grnRoutes);
    app.use('/api/v1/pharmacies/:pharmacyId/sales', salesRoutes);
    app.use('/api/v1/pharmacies/:pharmacyId/returns', returnsRoutes);
    app.use('/api/v1', safetyRoutes);

    app.use(errorHandler);

    const { request, close } = await createTestServer(app);
    t.after(async () => {
        await close();
    });

    // Generate tokens for testing
    const adminToken = jwt.sign({ userId: adminUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const pharmacistToken = jwt.sign({ userId: pharmacistUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const staffToken = jwt.sign({ userId: staffUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const verifierToken = jwt.sign({ userId: verifierUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });

    // =========================================================================
    // 1. GRN CONFIRMATION & VERIFICATION AUDIT TRAIL
    // =========================================================================
    await t.test('TC-AUD-01: GRN confirmation by Verifier records GRN_CONFIRMED audit event', async () => {
        const initialCount = auditEvents.length;

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/grns/${grnId}/confirm`, 'POST', {}, verifierToken);
        assert.equal(res.status, 200);

        assert.equal(auditEvents.length, initialCount + 1);
        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'GRN_CONFIRMED');
        assert.equal(latest.entity, 'GRN');
        assert.equal(String(latest.entityId), String(grnId));
        assert.equal(String(latest.pharmacyId), String(pharmacyA));
        assert.equal(String(latest.userId), String(verifierUserId));
        assert.match(latest.description, /Confirmed GRN/);
    });

    await t.test('TC-AUD-02: Requesting GRN corrections records GRN_CHANGES_REQUESTED audit event', async () => {
        const initialCount = auditEvents.length;
        grnDoc.status = 'PENDING_VERIFICATION';

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/grns/${grnId}/request-changes`, 'POST', {
            comment: 'Damaged packaging observed on Lot 1 items'
        }, verifierToken);

        assert.equal(res.status, 200);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'GRN_CHANGES_REQUESTED');
        assert.equal(latest.entity, 'GRN');
        assert.match(latest.description, /Damaged packaging observed/);
    });

    // =========================================================================
    // 2. SALES AUDIT TRAIL
    // =========================================================================
    await t.test('TC-AUD-03: Creating a draft sale records SALE_CREATED audit event', async () => {
        const initialCount = auditEvents.length;

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/sales`, 'POST', {
            items: [
                { medicineId, quantity: 2, unitPrice: 15.00 }
            ]
        }, staffToken);

        assert.equal(res.status, 201);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'SALE_CREATED');
        assert.equal(latest.entity, 'Sale');
        assert.equal(String(latest.pharmacyId), String(pharmacyA));
        assert.equal(String(latest.userId), String(staffUserId));
    });

    await t.test('TC-AUD-04: Completing a sale dispensing records SALE_COMPLETED audit event', async () => {
        const initialCount = auditEvents.length;
        const testSaleId = newId();

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/sales/${testSaleId}/complete`, 'POST', {}, staffToken);
        assert.equal(res.status, 200);

        assert.equal(auditEvents.length, initialCount + 1);
        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'SALE_COMPLETED');
        assert.equal(latest.entity, 'Sale');
        assert.equal(String(latest.entityId), String(testSaleId));
    });

    // =========================================================================
    // 3. RETURNS AUDIT TRAIL
    // =========================================================================
    await t.test('TC-AUD-05: Creating a return draft records RETURN_CREATED audit event', async () => {
        const initialCount = auditEvents.length;

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/returns`, 'POST', {
            returnType: 'customer',
            reason: 'Patient adverse reaction reported',
            items: [{ medicineId, quantity: 1, disposition: 'QUARANTINE' }]
        }, staffToken);

        assert.equal(res.status, 201);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'RETURN_CREATED');
        assert.equal(latest.entity, 'Return');
        assert.equal(String(latest.pharmacyId), String(pharmacyA));
        assert.match(latest.description, /adverse reaction/i);
    });

    await t.test('TC-AUD-06: Confirming a return records RETURN_CONFIRMED audit event', async () => {
        const initialCount = auditEvents.length;
        const returnId = newId();

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/returns/${returnId}/confirm`, 'POST', {
            disposition: 'RESTOCK_APPROVED'
        }, pharmacistToken);

        assert.equal(res.status, 200);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'RETURN_CONFIRMED');
        assert.equal(latest.entity, 'Return');
        assert.equal(String(latest.entityId), String(returnId));
        assert.match(latest.description, /RESTOCK_APPROVED/);
    });

    // =========================================================================
    // 4. SAFETY ACTIONS AUDIT TRAIL
    // =========================================================================
    await t.test('TC-AUD-07: Applying safety BLOCK action records SAFETY_ACTION_APPLIED audit event', async () => {
        const initialCount = auditEvents.length;
        const noticeId = newId();
        const matchId = newId();

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/safety-matches/${matchId}/action`, 'POST', {
            action: 'BLOCK',
            reason: 'Contamination recall reported by NMRA',
            batchId,
            safetyNoticeId: noticeId
        }, pharmacistToken);

        assert.equal(res.status, 200);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'SAFETY_ACTION_APPLIED');
        assert.equal(latest.entity, 'Batch');
        assert.equal(String(latest.entityId), String(batchId));
        assert.equal(String(latest.userId), String(pharmacistUserId));
        assert.match(latest.description, /Applied safety action BLOCK/);
    });

    await t.test('TC-AUD-08: Verifier applying safety QUARANTINE records SAFETY_ACTION_APPLIED audit event', async () => {
        const initialCount = auditEvents.length;
        const noticeId = newId();
        const matchId = newId();

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/safety-matches/${matchId}/action`, 'POST', {
            action: 'QUARANTINE',
            reason: 'Potency test discrepancy investigation pending',
            batchId,
            safetyNoticeId: noticeId
        }, verifierToken);

        assert.equal(res.status, 200);
        assert.equal(auditEvents.length, initialCount + 1);

        const latest = auditEvents[auditEvents.length - 1];
        assert.equal(latest.action, 'SAFETY_ACTION_APPLIED');
        assert.match(latest.description, /QUARANTINE/);
    });

    // =========================================================================
    // 5. ACCESS PERMISSIONS & BOUNDARY ENFORCEMENT
    // =========================================================================
    await t.test('TC-AUD-09: Staff without safety:action permission is rejected (403 PERMISSION_DENIED) and produces zero audit logs', async () => {
        const initialCount = auditEvents.length;
        const matchId = newId();

        const res = await request(`/api/v1/pharmacies/${pharmacyA}/safety-matches/${matchId}/action`, 'POST', {
            action: 'BLOCK',
            reason: 'Unauthorized attempt',
            batchId,
            safetyNoticeId: newId()
        }, staffToken);

        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'PERMISSION_DENIED');
        // Critical security requirement: unauthorized attempts must NOT generate operational success audit logs
        assert.equal(auditEvents.length, initialCount);
    });

    await t.test('TC-AUD-10: Staff without returns:approve cannot confirm returns (403 PERMISSION_DENIED)', async () => {
        const initialCount = auditEvents.length;
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/returns/${newId()}/confirm`, 'POST', {
            disposition: 'RESTOCK_APPROVED'
        }, staffToken);

        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'PERMISSION_DENIED');
        assert.equal(auditEvents.length, initialCount);
    });

    await t.test('TC-AUD-11: Cross-pharmacy access attempts are rejected (403 CROSS_PHARMACY_ACCESS_DENIED) across returns and sales', async () => {
        // Token has pharmacyA, URL targets pharmacyB
        const resSales = await request(`/api/v1/pharmacies/${pharmacyB}/sales`, 'GET', undefined, staffToken);
        assert.equal(resSales.status, 403);
        assert.equal(resSales.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');

        const resReturns = await request(`/api/v1/pharmacies/${pharmacyB}/returns`, 'GET', undefined, staffToken);
        assert.equal(resReturns.status, 403);
        assert.equal(resReturns.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
    });
});

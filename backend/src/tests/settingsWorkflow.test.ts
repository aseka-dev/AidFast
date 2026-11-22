import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Routes & Middleware
import settingsRoutes from '../routes/settingsRoutes';
import errorHandler from '../middleware/errorHandler';

// Models
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import PharmacySetting from '../models/PharmacySetting';
import AuditLog from '../models/AuditLog';

const newId = () => new mongoose.Types.ObjectId().toString();

// Test fixtures
const JWT_TEST_SECRET = 'aidfast-settings-test-secret-2026';
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
        ? `\\\\.\\pipe\\aidfast-set-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        : `/tmp/aidfast-set-${Date.now()}-${Math.floor(Math.random() * 100000)}.sock`;

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
                            // keep as raw text
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

test('AidFast Multi-Tenant Pharmacy Settings Workflow Suite (Sprint 3 Day 12)', async (t) => {
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
        { _id: pharmacistRoleId, id: pharmacistRoleId, name: 'PHARMACIST', permissions: ['pharmacy:settings', 'pharmacy:settings:read'] },
        { _id: staffRoleId, id: staffRoleId, name: 'STAFF', permissions: ['pharmacy:settings:read'] },
        { _id: verifierRoleId, id: verifierRoleId, name: 'VERIFIER', permissions: ['pharmacy:settings:read'] }
    ];

    const memberships: any[] = [
        { _id: newId(), id: newId(), userId: adminUserId, pharmacyId: pharmacyA, roleId: adminRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: pharmacistUserId, pharmacyId: pharmacyA, roleId: pharmacistRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: staffUserId, pharmacyId: pharmacyA, roleId: staffRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: verifierUserId, pharmacyId: pharmacyA, roleId: verifierRoleId, isActive: true }
    ];

    const settingsStore = new Map<string, any>();
    const auditEvents: any[] = [];

    // Model Doubles
    t.mock.method(User, 'findById', (id: any) => {
        const u = users.find((x) => String(x.id) === String(id));
        return Promise.resolve(u || null);
    });

    t.mock.method(PharmacyUser, 'findOne', (query: any) => {
        const m = memberships.find((x) =>
            String(x.userId) === String(query.userId) &&
            String(x.pharmacyId) === String(query.pharmacyId) &&
            x.isActive
        );
        return Promise.resolve(m || null);
    });

    t.mock.method(Role, 'findById', (id: any) => {
        const r = roles.find((x) => String(x.id) === String(id));
        return Promise.resolve(r || null);
    });

    t.mock.method(Pharmacy, 'findOne', (query: any) => {
        return Promise.resolve({
            _id: query._id,
            id: query._id,
            name: 'Greenway Community Pharmacy',
            status: 'ACTIVE'
        });
    });

    t.mock.method(Pharmacy, 'findById', (id: any) => {
        return {
            select: () => Promise.resolve({
                _id: id,
                id,
                name: 'Greenway Community Pharmacy',
                address: '128 Lake Road, Colombo 06',
                contactNumber: '+94 11 245 6072',
                email: 'care@greenwaypharmacy.lk',
                registrationNumber: 'PH-COL-2026-001',
                status: 'ACTIVE'
            })
        };
    });

    t.mock.method(Pharmacy, 'findByIdAndUpdate', (id: any, update: any) => {
        return Promise.resolve({
            _id: id,
            id,
            name: update.name || 'Greenway Community Pharmacy',
            address: update.address || '128 Lake Road, Colombo 06',
            contactNumber: update.contactNumber || '+94 11 245 6072',
            email: update.email || 'care@greenwaypharmacy.lk',
            status: 'ACTIVE'
        });
    });

    t.mock.method(PharmacySetting, 'findOne', (filter: any) => {
        const doc = settingsStore.get(String(filter.pharmacyId));
        return Promise.resolve(doc || null);
    });

    t.mock.method(PharmacySetting, 'create', async (data: any) => {
        const doc = {
            _id: newId(),
            id: newId(),
            ...data,
            save: async function () { return this; }
        };
        settingsStore.set(String(data.pharmacyId), doc);
        return doc;
    });

    t.mock.method(PharmacySetting, 'findOneAndUpdate', async (filter: any, update: any) => {
        let doc = settingsStore.get(String(filter.pharmacyId));
        if (!doc) {
            doc = {
                _id: newId(),
                id: newId(),
                pharmacyId: filter.pharmacyId,
                timezone: 'Asia/Colombo',
                lowStockThreshold: 10,
                publicAvailabilityEnabled: true,
                expiryAlertMonths: [12, 9, 6],
                dateFormat: 'DD MMM YYYY',
                currency: 'LKR — Sri Lankan Rupee'
            };
        }
        if (update.$set) {
            Object.assign(doc, update.$set);
        }
        settingsStore.set(String(filter.pharmacyId), doc);
        return doc;
    });

    t.mock.method(AuditLog, 'create', async (data: any) => {
        auditEvents.push(data);
        return { _id: newId(), ...data };
    });

    // Build Express test app
    const app = express();
    app.use(express.json());

    // Mount settings routes with multi-tenant parameter scope and root aliases
    app.use('/api/v1/pharmacies/:pharmacyId/settings', settingsRoutes);
    app.use('/api/v1/settings', settingsRoutes);
    app.use('/api/settings', settingsRoutes);

    app.use(errorHandler);

    const { request, close } = await createTestServer(app);
    t.after(async () => {
        await close();
    });

    // Tokens
    const adminToken = jwt.sign({ userId: adminUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const pharmacistToken = jwt.sign({ userId: pharmacistUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const staffToken = jwt.sign({ userId: staffUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const verifierToken = jwt.sign({ userId: verifierUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const tokenNoPharmacy = jwt.sign({ userId: pharmacistUserId }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });

    // =========================================================================
    // SUITE 1: Multi-Tenant Settings Retrieval & Defaults
    // =========================================================================
    await t.test('TC-SET-01: Pharmacist retrieves settings via tenant route with default values', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/settings`, 'GET', undefined, pharmacistToken);
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.settings.timezone, 'Asia/Colombo');
        assert.equal(res.body.settings.lowStockThreshold, 10);
        assert.equal(res.body.settings.publicAvailabilityEnabled, true);
        assert.deepEqual(res.body.settings.expiryAlertMonths, [12, 9, 6]);
        assert.equal(res.body.pharmacy.name, 'Greenway Community Pharmacy');
    });

    await t.test('TC-SET-02: Missing JWT authorization returns 401 UNAUTHORIZED', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/settings`, 'GET', undefined, null);
        assert.equal(res.status, 401);
    });

    await t.test('TC-SET-03: Token without selected pharmacy context returns 400 PHARMACY_SELECTION_REQUIRED', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/settings`, 'GET', undefined, tokenNoPharmacy);
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'PHARMACY_SELECTION_REQUIRED');
    });

    // =========================================================================
    // SUITE 2: Cross-Pharmacy Tenant Perimeter Defense
    // =========================================================================
    await t.test('TC-SET-04: Cross-pharmacy GET attempt is blocked with 403 CROSS_PHARMACY_ACCESS_DENIED', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyB}/settings`, 'GET', undefined, pharmacistToken);
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
        assert.equal(res.body.message, 'You cannot access another pharmacy');
    });

    await t.test('TC-SET-05: Cross-pharmacy PUT attempt is blocked with 403 CROSS_PHARMACY_ACCESS_DENIED', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyB}/settings`,
            'PUT',
            { lowStockThreshold: 5 },
            pharmacistToken
        );
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
    });

    // =========================================================================
    // SUITE 3: Timezone Validation
    // =========================================================================
    await t.test('TC-SET-06: Pharmacist updates timezone to valid IANA zones (UTC, Asia/Singapore)', async () => {
        const res1 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { timezone: 'UTC' },
            pharmacistToken
        );
        assert.equal(res1.status, 200);
        assert.equal(res1.body.settings.timezone, 'UTC');

        const res2 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { timezone: 'Asia/Singapore' },
            pharmacistToken
        );
        assert.equal(res2.status, 200);
        assert.equal(res2.body.settings.timezone, 'Asia/Singapore');
    });

    await t.test('TC-SET-07: Invalid IANA timezone string is rejected with 400 VALIDATION_ERROR', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { timezone: 'Invalid/Not_A_Timezone' },
            pharmacistToken
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'VALIDATION_ERROR');
        assert.equal(res.body.message, 'Invalid IANA timezone specified');
    });

    // =========================================================================
    // SUITE 4: Inventory Alert Thresholds Validation
    // =========================================================================
    await t.test('TC-SET-08: Pharmacist updates lowStockThreshold to non-negative integer', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { lowStockThreshold: 25 },
            pharmacistToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.settings.lowStockThreshold, 25);
    });

    await t.test('TC-SET-09: Negative lowStockThreshold is rejected with 400 VALIDATION_ERROR', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { lowStockThreshold: -5 },
            pharmacistToken
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'VALIDATION_ERROR');
        assert.equal(res.body.message, 'Invalid low stock threshold');
    });

    await t.test('TC-SET-10: Fractional/float lowStockThreshold is rejected with 400 VALIDATION_ERROR', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { lowStockThreshold: 12.5 },
            pharmacistToken
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'VALIDATION_ERROR');
    });

    await t.test('TC-SET-11: Updating expiryAlertMonths with valid subset [12, 6] succeeds', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { expiryAlertMonths: [12, 6] },
            pharmacistToken
        );
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.settings.expiryAlertMonths, [12, 6]);
    });

    await t.test('TC-SET-12: Updating expiryAlertMonths with invalid values [15, 3] or empty array is rejected with 400', async () => {
        const res1 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { expiryAlertMonths: [15, 3] },
            pharmacistToken
        );
        assert.equal(res1.status, 400);
        assert.equal(res1.body.code, 'VALIDATION_ERROR');

        const res2 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { expiryAlertMonths: [] },
            pharmacistToken
        );
        assert.equal(res2.status, 400);
        assert.equal(res2.body.code, 'VALIDATION_ERROR');
    });

    // =========================================================================
    // SUITE 5: Public Availability Visibility Toggle Validation
    // =========================================================================
    await t.test('TC-SET-13: Pharmacist disables and re-enables public availability visibility', async () => {
        const res1 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { publicAvailabilityEnabled: false },
            pharmacistToken
        );
        assert.equal(res1.status, 200);
        assert.equal(res1.body.settings.publicAvailabilityEnabled, false);

        const res2 = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { publicAvailabilityEnabled: true },
            pharmacistToken
        );
        assert.equal(res2.status, 200);
        assert.equal(res2.body.settings.publicAvailabilityEnabled, true);
    });

    await t.test('TC-SET-14: Non-boolean publicAvailabilityEnabled is rejected with 400 VALIDATION_ERROR', async () => {
        const res = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { publicAvailabilityEnabled: 'false' as any },
            pharmacistToken
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'VALIDATION_ERROR');
        assert.equal(res.body.message, 'publicAvailabilityEnabled must be a boolean');
    });

    // =========================================================================
    // SUITE 6: Role-Based Access Control (RBAC)
    // =========================================================================
    await t.test('TC-SET-15: Staff with pharmacy:settings:read can view settings but cannot modify (403 PERMISSION_DENIED)', async () => {
        const getRes = await request(`/api/v1/pharmacies/${pharmacyA}/settings`, 'GET', undefined, staffToken);
        assert.equal(getRes.status, 200);

        const putRes = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { lowStockThreshold: 50 },
            staffToken
        );
        assert.equal(putRes.status, 403);
        assert.equal(putRes.body.code, 'PERMISSION_DENIED');
    });

    await t.test('TC-SET-16: Verifier cannot modify pharmacy settings (403 PERMISSION_DENIED)', async () => {
        const putRes = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { timezone: 'UTC' },
            verifierToken
        );
        assert.equal(putRes.status, 403);
        assert.equal(putRes.body.code, 'PERMISSION_DENIED');
    });

    await t.test('TC-SET-17: Admin has full authority to modify pharmacy settings', async () => {
        const putRes = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            { lowStockThreshold: 15, timezone: 'Asia/Colombo' },
            adminToken
        );
        assert.equal(putRes.status, 200);
        assert.equal(putRes.body.settings.lowStockThreshold, 15);
        assert.equal(putRes.body.settings.timezone, 'Asia/Colombo');
    });

    // =========================================================================
    // SUITE 7: Audit Logging
    // =========================================================================
    await t.test('TC-SET-18: Settings updates record SETTINGS_UPDATED audit event with modified configuration', async () => {
        auditEvents.length = 0; // Clear previous audit events

        const putRes = await request(
            `/api/v1/pharmacies/${pharmacyA}/settings`,
            'PUT',
            {
                timezone: 'Asia/Colombo',
                lowStockThreshold: 30,
                publicAvailabilityEnabled: false,
                expiryAlertMonths: [12, 9, 6]
            },
            pharmacistToken
        );

        assert.equal(putRes.status, 200);
        assert.equal(auditEvents.length, 1);
        const event = auditEvents[0];
        assert.equal(event.action, 'SETTINGS_UPDATED');
        assert.equal(event.entity, 'PharmacySetting');
        assert.equal(String(event.pharmacyId), pharmacyA);
        assert.equal(String(event.userId), pharmacistUserId);
        assert.ok(event.description.includes('lowStockThreshold=30'));
        assert.ok(event.description.includes('timezone=Asia/Colombo'));
        assert.ok(event.description.includes('publicAvailability=false'));
    });
});

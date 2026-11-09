import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Routes
import supplierRoutes from '../routes/supplierRoutes';
import purchaseOrderRoutes from '../routes/purchaseOrderRoutes';
import grnRoutes from '../routes/grnRoutes';
import settingsRoutes from '../routes/settingsRoutes';
import userRoutes from '../routes/userRoutes';

// Middleware & Utilities
import { authenticate, requireSelectedPharmacy } from '../middleware/authMiddleware';
import matchPharmacyParam from '../middleware/matchPharmacyParam';
import errorHandler from '../middleware/errorHandler';
import {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    TenantAccessError,
    NotFoundError,
    ConflictError,
    ValidationError
} from '../utils/errors';

// Models
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import PharmacySetting from '../models/PharmacySetting';
import AuditLog from '../models/AuditLog';
import Supplier from '../models/Supplier';

const newId = () => new mongoose.Types.ObjectId().toString();

// Test fixtures
const JWT_TEST_SECRET = 'aidfast-security-test-secret-2026';
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

// Helper to spawn a test HTTP server using named pipes (Windows) or domain sockets (Unix)
const createTestServer = async (app: express.Express) => {
    const pipeName = process.platform === 'win32'
        ? `\\\\.\\pipe\\aidfast-sec-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        : `/tmp/aidfast-sec-${Date.now()}-${Math.floor(Math.random() * 100000)}.sock`;

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(pipeName, resolve));

    const request = (
        path: string,
        method = 'GET',
        body?: unknown,
        token?: string | null,
        rawBody?: string
    ) => {
        return new Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
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
                        resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
                    });
                }
            );

            req.on('error', reject);

            if (rawBody !== undefined) {
                req.write(rawBody);
            } else if (body !== undefined) {
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

test('AidFast Security & Tenant Isolation Test Suite (Sprint 2 Day 9)', async (t) => {
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
        { _id: pharmacistRoleId, id: pharmacistRoleId, name: 'PHARMACIST', permissions: ['pharmacy:settings', 'pharmacy:settings:read', 'users:read', 'users:create', 'users:update', 'users:delete', 'suppliers:read', 'suppliers:create', 'po:read', 'po:create'] },
        { _id: staffRoleId, id: staffRoleId, name: 'STAFF', permissions: ['pharmacy:settings:read', 'users:read', 'sales:create', 'inventory:read'] },
        { _id: verifierRoleId, id: verifierRoleId, name: 'VERIFIER', permissions: ['pharmacy:settings:read', 'users:read', 'grn:verify', 'po:read'] }
    ];

    const memberships: any[] = [
        { _id: newId(), id: newId(), userId: adminUserId, pharmacyId: pharmacyA, roleId: adminRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: pharmacistUserId, pharmacyId: pharmacyA, roleId: pharmacistRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: staffUserId, pharmacyId: pharmacyA, roleId: staffRoleId, isActive: true },
        { _id: newId(), id: newId(), userId: verifierUserId, pharmacyId: pharmacyA, roleId: verifierRoleId, isActive: true }
    ];

    const settingsStore: Record<string, any> = {
        [pharmacyA]: {
            pharmacyId: pharmacyA,
            expiryAlertMonths: 12,
            expiryWarningMonths: 9,
            criticalExpiryMonths: 6,
            lowStockThreshold: 10,
            dateFormat: 'DD MMM YYYY',
            currency: 'LKR'
        }
    };

    const auditEvents: any[] = [];

    // Query mock helper to support chaining (.select, .populate, .sort, etc.)
    const makeDocQuery = (val: any) => {
        let current = val;
        const q: any = Promise.resolve(current);
        q.select = () => makeDocQuery(current);
        q.sort = () => makeDocQuery(current);
        q.session = () => makeDocQuery(current);
        q.populate = (field: string) => {
            if (Array.isArray(current)) {
                current = current.map(item => {
                    const clone = { ...item };
                    if (field === 'roleId' || field === 'role') {
                        clone.roleId = roles.find(r => String(r._id) === String(clone.roleId) || String(r.id) === String(clone.roleId));
                    }
                    if (field === 'userId' || field === 'user') {
                        clone.userId = users.find(u => String(u._id) === String(clone.userId) || String(u.id) === String(clone.userId));
                    }
                    return clone;
                });
            } else if (current) {
                const clone = { ...current };
                if (field === 'roleId' || field === 'role') {
                    clone.roleId = roles.find(r => String(r._id) === String(clone.roleId) || String(r.id) === String(clone.roleId));
                }
                if (field === 'userId' || field === 'user') {
                    clone.userId = users.find(u => String(u._id) === String(clone.userId) || String(u.id) === String(clone.userId));
                }
                current = clone;
            }
            return makeDocQuery(current);
        };
        return q;
    };

    // Mongoose Model doubles
    t.mock.method(User, 'findById', (id: any) => {
        const searchId = id && typeof id === 'object' ? (id._id || id.id) : id;
        const user = users.find(u => String(u._id) === String(searchId) || String(u.id) === String(searchId));
        return makeDocQuery(user || null);
    });

    t.mock.method(User, 'findOne', (filter: any) => {
        if (filter?.email) {
            const user = users.find(u => u.email === filter.email);
            return makeDocQuery(user || null);
        }
        return makeDocQuery(null);
    });

    t.mock.method(User, 'create', async (data: any) => {
        const created = { _id: newId(), id: newId(), ...data };
        users.push(created);
        return created;
    });

    t.mock.method(Pharmacy, 'findOne', (filter: any) => {
        const id = filter?._id;
        if (!id || String(id) === String(pharmacyA)) {
            return makeDocQuery({
                _id: pharmacyA,
                id: pharmacyA,
                name: 'Greenway Community Pharmacy',
                address: '128 Lake Road, Colombo 06',
                status: 'ACTIVE'
            });
        }
        return makeDocQuery(null);
    });

    t.mock.method(Pharmacy, 'findById', (id: string) => {
        return makeDocQuery({
            _id: id,
            id,
            name: 'Greenway Community Pharmacy',
            address: '128 Lake Road, Colombo 06',
            status: 'ACTIVE'
        });
    });

    t.mock.method(PharmacyUser, 'findOne', (filter: any) => {
        const membership = memberships.find(m => {
            if (filter?._id && String(m._id) !== String(filter._id)) return false;
            if (filter?.userId && String(m.userId) !== String(filter.userId)) return false;
            if (filter?.pharmacyId && String(m.pharmacyId) !== String(filter.pharmacyId)) return false;
            if (filter?.isActive !== undefined && m.isActive !== filter.isActive) return false;
            return true;
        });

        if (membership) {
            const doc = {
                ...membership,
                save: async function () {
                    Object.assign(membership, this);
                    return this;
                }
            };
            return makeDocQuery(doc);
        }
        return makeDocQuery(null);
    });

    t.mock.method(PharmacyUser, 'find', (filter: any) => {
        const filtered = memberships.filter(m => {
            if (filter?.pharmacyId && String(m.pharmacyId) !== String(filter.pharmacyId)) return false;
            return true;
        }).map(m => ({
            ...m,
            userId: users.find(u => String(u._id) === String(m.userId)),
            roleId: roles.find(r => String(r._id) === String(m.roleId)),
            save: async function () { return this; }
        }));
        return makeDocQuery(filtered);
    });

    t.mock.method(PharmacyUser, 'create', async (data: any) => {
        const created = { _id: newId(), id: newId(), ...data, save: async function () { return this; } };
        memberships.push(created);
        return created;
    });

    t.mock.method(Role, 'findById', (id: any) => {
        const searchId = id && typeof id === 'object' ? (id._id || id.id) : id;
        const role = roles.find(r => String(r._id) === String(searchId) || String(r.id) === String(searchId));
        return makeDocQuery(role || null);
    });

    t.mock.method(Role, 'findOne', (filter: any) => {
        if (filter?.name) {
            const role = roles.find(r => r.name.toUpperCase() === filter.name.toUpperCase());
            return makeDocQuery(role || null);
        }
        return makeDocQuery(null);
    });

    t.mock.method(PharmacySetting, 'findOne', (filter: any) => {
        const setting = settingsStore[filter?.pharmacyId];
        return makeDocQuery(setting || null);
    });

    t.mock.method(PharmacySetting, 'findOneAndUpdate', (filter: any, update: any) => {
        const phId = filter?.pharmacyId;
        const current = settingsStore[phId] || { pharmacyId: phId };
        const updated = {
            ...current,
            ...update?.$set,
            id: newId(),
            _id: newId(),
            save: async function () { return this; }
        };
        settingsStore[phId] = updated;
        return makeDocQuery(updated);
    });

    t.mock.method(Supplier, 'find', () => makeDocQuery([{ _id: newId(), supplierName: 'Safe Pharma Ltd' }]));

    t.mock.method(AuditLog, 'create', async (data: any) => {
        auditEvents.push({ ...data, createdAt: new Date() });
        return { _id: newId(), id: newId(), ...data };
    });

    // Create Express application matching server.ts routing
    const app = express();
    app.use(express.json());

    // Internal routes with :pharmacyId parameter
    app.use('/api/v1/pharmacies/:pharmacyId/suppliers', supplierRoutes);
    app.use('/api/v1/pharmacies/:pharmacyId/purchase-orders', purchaseOrderRoutes);
    app.use('/api/v1/pharmacies/:pharmacyId/grns', authenticate, requireSelectedPharmacy, matchPharmacyParam, grnRoutes);

    // Platform tenant routes (using token pharmacy context)
    app.use('/api/v1/settings', settingsRoutes);
    app.use('/api/v1/users', userRoutes);

    // Test routes for centralized error verification
    app.get('/api/test/syntax-error', (_req, _res, next) => {
        const err: any = new SyntaxError('Unexpected token');
        err.body = '{"bad":';
        err.status = 400;
        next(err);
    });

    app.get('/api/test/cast-error', (_req, _res, next) => {
        const err: any = new Error('Cast to ObjectId failed');
        err.name = 'CastError';
        err.path = '_id';
        err.value = 'invalid-object-id';
        next(err);
    });

    app.get('/api/test/validation-error', (_req, _res, next) => {
        const err: any = new Error('Validation failed');
        err.name = 'ValidationError';
        err.errors = {
            email: { message: 'Email is required' },
            password: { message: 'Password is too short' }
        };
        next(err);
    });

    app.get('/api/test/duplicate-key', (_req, _res, next) => {
        const err: any = new Error('E11000 duplicate key error');
        err.code = 11000;
        err.keyValue = { email: 'admin@aidfast.lk' };
        next(err);
    });

    app.get('/api/test/custom-error/:type', (req, _res, next) => {
        const { type } = req.params;
        if (type === 'bad-request') return next(new BadRequestError('Bad input data'));
        if (type === 'unauthorized') return next(new UnauthorizedError('Login required'));
        if (type === 'forbidden') return next(new ForbiddenError('No permission'));
        if (type === 'tenant-access') return next(new TenantAccessError());
        if (type === 'not-found') return next(new NotFoundError('Item missing'));
        if (type === 'conflict') return next(new ConflictError('Item exists'));
        if (type === 'validation') return next(new ValidationError('Invalid form', ['field is required']));
        next(new Error('Unknown unhandled error'));
    });

    // Mount Centralized Error Handler
    app.use(errorHandler);

    const { request, close } = await createTestServer(app);
    t.after(async () => {
        await close();
    });

    // Generate tokens
    const adminToken = jwt.sign({ userId: adminUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const pharmacistToken = jwt.sign({ userId: pharmacistUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const staffToken = jwt.sign({ userId: staffUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const verifierToken = jwt.sign({ userId: verifierUserId, pharmacyId: pharmacyA }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });
    const unselectedToken = jwt.sign({ userId: adminUserId }, JWT_TEST_SECRET, { issuer: 'aidfast-api' });

    // =========================================================================
    // SUITE 1: Multi-Tenant Internal Route Isolation (Cross-Pharmacy Defense)
    // =========================================================================
    await t.test('TC-SEC-01: Rejects cross-pharmacy URL mismatch on suppliers endpoint with 403', async () => {
        // Token has pharmacyA, URL requests pharmacyB
        const res = await request(`/api/v1/pharmacies/${pharmacyB}/suppliers`, 'GET', undefined, adminToken);
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
        assert.equal(res.body.message, 'You cannot access another pharmacy');
    });

    await t.test('TC-SEC-02: Rejects cross-pharmacy URL mismatch on purchase-orders endpoint with 403', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyB}/purchase-orders`, 'GET', undefined, adminToken);
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
    });

    await t.test('TC-SEC-03: Rejects cross-pharmacy URL mismatch on grns endpoint with 403', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyB}/grns`, 'GET', undefined, adminToken);
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CROSS_PHARMACY_ACCESS_DENIED');
    });

    await t.test('TC-SEC-04: Allows authorized tenant access when token matches URL pharmacy', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/suppliers`, 'GET', undefined, adminToken);
        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.body.data));
    });

    await t.test('TC-SEC-05: Rejects tenant route access when token has no selected pharmacy context', async () => {
        const res = await request(`/api/v1/pharmacies/${pharmacyA}/suppliers`, 'GET', undefined, unselectedToken);
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'PHARMACY_SELECTION_REQUIRED');
    });

    // =========================================================================
    // SUITE 2: Authentication & Token Lifecycle Security
    // =========================================================================
    await t.test('TC-SEC-06: Missing Authorization header is rejected with 401', async () => {
        const res = await request('/api/v1/settings', 'GET', undefined, null);
        assert.equal(res.status, 401);
        assert.equal(res.body.code, 'INVALID_TOKEN');
    });

    await t.test('TC-SEC-07: Malformed or forged JWT is rejected with 401', async () => {
        const res = await request('/api/v1/settings', 'GET', undefined, 'invalid.forged.jwt');
        assert.equal(res.status, 401);
        assert.equal(res.body.code, 'INVALID_TOKEN');
    });

    await t.test('TC-SEC-08: Expired JWT is rejected with 401', async () => {
        const expiredToken = jwt.sign(
            { userId: adminUserId, pharmacyId: pharmacyA, exp: Math.floor(Date.now() / 1000) - 3600 },
            JWT_TEST_SECRET,
            { issuer: 'aidfast-api' }
        );
        const res = await request('/api/v1/settings', 'GET', undefined, expiredToken);
        assert.equal(res.status, 401);
        assert.equal(res.body.code, 'INVALID_TOKEN');
    });

    // =========================================================================
    // SUITE 3: Role-Based Access Control (RBAC) & Boundary Enforcement
    // =========================================================================
    await t.test('TC-SEC-09: Admin can read and modify pharmacy settings', async () => {
        const getRes = await request('/api/v1/settings', 'GET', undefined, adminToken);
        assert.equal(getRes.status, 200);

        const putRes = await request('/api/v1/settings', 'PUT', { lowStockThreshold: 12, expiryAlertMonths: [12, 9, 6] }, adminToken);
        assert.equal(putRes.status, 200);
    });

    await t.test('TC-SEC-10: Pharmacist can read and modify pharmacy settings', async () => {
        const getRes = await request('/api/v1/settings', 'GET', undefined, pharmacistToken);
        assert.equal(getRes.status, 200);

        const putRes = await request('/api/v1/settings', 'PUT', { lowStockThreshold: 15 }, pharmacistToken);
        assert.equal(putRes.status, 200);
    });

    await t.test('TC-SEC-11: Staff can read settings but is forbidden from updating settings', async () => {
        const getRes = await request('/api/v1/settings', 'GET', undefined, staffToken);
        assert.equal(getRes.status, 200);

        const putRes = await request('/api/v1/settings', 'PUT', { lowStockThreshold: 20 }, staffToken);
        assert.equal(putRes.status, 403);
        assert.equal(putRes.body.code, 'PERMISSION_DENIED');
    });

    await t.test('TC-SEC-12: Verifier can read settings but is forbidden from updating settings', async () => {
        const getRes = await request('/api/v1/settings', 'GET', undefined, verifierToken);
        assert.equal(getRes.status, 200);

        const putRes = await request('/api/v1/settings', 'PUT', { lowStockThreshold: 20 }, verifierToken);
        assert.equal(putRes.status, 403);
        assert.equal(putRes.body.code, 'PERMISSION_DENIED');
    });

    await t.test('TC-SEC-13: Staff without users:create permission cannot create users', async () => {
        const res = await request('/api/v1/users', 'POST', {
            fullName: 'Unauthorized Addition',
            email: 'unauth@aidfast.lk',
            password: 'ValidPassword123!',
            roleName: 'STAFF'
        }, staffToken);

        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'PERMISSION_DENIED');
    });

    // =========================================================================
    // SUITE 4: Administrative Self-Protection & Demotion Guards
    // =========================================================================
    await t.test('TC-SEC-14: Admin cannot demote their own admin role', async () => {
        const adminMembership = memberships.find(m => String(m.userId) === String(adminUserId));
        assert.ok(adminMembership, 'Admin membership must exist');

        const res = await request(`/api/v1/users/${adminMembership._id}/role`, 'PUT', {
            roleName: 'STAFF'
        }, adminToken);

        assert.equal(res.status, 400);
        assert.match(res.body.message, /cannot demote your own admin account/i);
    });

    await t.test('TC-SEC-15: Admin cannot remove their own active membership', async () => {
        const adminMembership = memberships.find(m => String(m.userId) === String(adminUserId));
        assert.ok(adminMembership, 'Admin membership must exist');

        const res = await request(`/api/v1/users/${adminMembership._id}`, 'DELETE', undefined, adminToken);
        assert.equal(res.status, 400);
        assert.match(res.body.message, /cannot remove your own active membership/i);
    });

    // =========================================================================
    // SUITE 5: Centralized Error Infrastructure Integration
    // =========================================================================
    await t.test('TC-SEC-16: Malformed JSON payload is intercepted and sanitized by errorHandler', async () => {
        const res = await request('/api/v1/settings', 'PUT', undefined, adminToken, '{ bad: json, not formatted');
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_JSON');
        assert.equal(res.body.message, 'Invalid JSON in request payload');
        assert.equal(res.body.success, false);
    });

    await t.test('TC-SEC-17: Mongoose CastError on malformed ObjectId returns 400 with INVALID_ID_FORMAT', async () => {
        const res = await request('/api/test/cast-error', 'GET');
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_ID_FORMAT');
        assert.match(res.body.message, /Invalid identifier format/);
    });

    await t.test('TC-SEC-18: Mongoose ValidationError returns 400 with VALIDATION_ERROR and details', async () => {
        const res = await request('/api/test/validation-error', 'GET');
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'VALIDATION_ERROR');
        assert.ok(Array.isArray(res.body.details));
        assert.equal(res.body.details.length, 2);
    });

    await t.test('TC-SEC-19: Mongoose Duplicate Key Error (E11000) returns 409 DUPLICATE_KEY_ERROR', async () => {
        const res = await request('/api/test/duplicate-key', 'GET');
        assert.equal(res.status, 409);
        assert.equal(res.body.code, 'DUPLICATE_KEY_ERROR');
        assert.match(res.body.message, /Duplicate value for unique field/);
    });

    await t.test('TC-SEC-20: AppError hierarchy maps status codes and codes correctly', async () => {
        const cases = [
            { path: 'bad-request', expectedStatus: 400, expectedCode: 'BAD_REQUEST' },
            { path: 'unauthorized', expectedStatus: 401, expectedCode: 'UNAUTHORIZED' },
            { path: 'forbidden', expectedStatus: 403, expectedCode: 'FORBIDDEN' },
            { path: 'tenant-access', expectedStatus: 403, expectedCode: 'CROSS_PHARMACY_ACCESS_DENIED' },
            { path: 'not-found', expectedStatus: 404, expectedCode: 'NOT_FOUND' },
            { path: 'conflict', expectedStatus: 409, expectedCode: 'CONFLICT' },
            { path: 'validation', expectedStatus: 400, expectedCode: 'VALIDATION_ERROR' }
        ];

        for (const c of cases) {
            const res = await request(`/api/test/custom-error/${c.path}`, 'GET');
            assert.equal(res.status, c.expectedStatus, `Status for ${c.path}`);
            assert.equal(res.body.code, c.expectedCode, `Code for ${c.path}`);
            assert.equal(res.body.success, false);
        }
    });

    // =========================================================================
    // SUITE 6: Security Audit Logging Verification
    // =========================================================================
    await t.test('TC-SEC-21: Creating a user generates an audit log entry', async () => {
        const initialAuditCount = auditEvents.length;

        const res = await request('/api/v1/users', 'POST', {
            fullName: 'Audited Member',
            email: 'audited@aidfast.lk',
            password: 'SecurePassword123!',
            roleName: 'STAFF'
        }, adminToken);

        assert.equal(res.status, 201);
        assert.equal(auditEvents.length, initialAuditCount + 1);

        const latestAudit = auditEvents[auditEvents.length - 1];
        assert.equal(latestAudit.action, 'USER_CREATED');
        assert.equal(latestAudit.entity, 'User');
        assert.equal(String(latestAudit.pharmacyId), String(pharmacyA));
        assert.equal(String(latestAudit.userId), String(adminUserId));
    });

    await t.test('TC-SEC-22: Updating user role generates an audit log entry', async () => {
        const staffMembership = memberships.find(m => String(m.userId) === String(staffUserId));
        assert.ok(staffMembership);

        const initialAuditCount = auditEvents.length;
        const res = await request(`/api/v1/users/${staffMembership._id}/role`, 'PUT', {
            roleName: 'VERIFIER'
        }, adminToken);

        assert.equal(res.status, 200);
        assert.equal(auditEvents.length, initialAuditCount + 1);

        const latestAudit = auditEvents[auditEvents.length - 1];
        assert.equal(latestAudit.action, 'USER_ROLE_UPDATED');
        assert.equal(latestAudit.entity, 'PharmacyUser');
        assert.equal(String(latestAudit.pharmacyId), String(pharmacyA));
    });
});

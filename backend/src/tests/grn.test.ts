import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import grnRoutes from '../routes/grnRoutes';
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import GRN from '../models/Grn';
import GRNItem from '../models/GrnItem';
import Supplier from '../models/Supplier';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseOrderItem from '../models/PurchaseOrderItem';
import { grnInput } from '../services/grnValidation';

const id = () => new mongoose.Types.ObjectId().toString();

test('GRN input rejects invalid quantities and calculates accepted quantity', async () => {
  const valid = {
    supplierId: id(),
    invoiceNumber: 'INV-1',
    receivedDate: '2026-11-08',
    items: [{
      medicineId: id(),
      batchNumber: 'BATCH-1',
      expiryDate: '2028-11-08',
      receivedQuantity: 10,
      rejectedQuantity: 3,
      damagedQuantity: 1,
      returnedQuantity: 1,
    }],
  };
  assert.equal(grnInput.parse(valid).items[0].receivedQuantity - grnInput.parse(valid).items[0].rejectedQuantity, 7);
  for (const receivedQuantity of [-1, 1.5, Infinity]) {
    assert.equal(grnInput.safeParse({
      ...valid,
      items: [{ ...valid.items[0], receivedQuantity }],
    }).success, false);
  }
  assert.equal(grnInput.safeParse({
    ...valid,
    items: [{ ...valid.items[0], receivedQuantity: 2, rejectedQuantity: 3 }],
  }).success, false);
  assert.equal(grnInput.safeParse({
    ...valid,
    items: [{ ...valid.items[0], rejectedQuantity: 1, damagedQuantity: 1, returnedQuantity: 1 }],
  }).success, false);
});

test('GRN routes enforce permissions and pharmacy scope without posting stock', async t => {
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'grn-test-secret';
  t.after(() => {
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  const pharmacyId = id();
  const otherPharmacyId = id();
  const userId = id();
  const supplierId = id();
  const medicineId = id();
  let roleName = 'STAFF';
  const grns: InstanceType<typeof GRN>[] = [];
  const items: InstanceType<typeof GRNItem>[] = [];

  const matches = (document: unknown, filter: Record<string, unknown>) =>
    Object.entries(filter).every(([key, expected]) => {
      const actual = (document as Record<string, unknown>)[key];
      if (expected && typeof expected === 'object' && '$ne' in expected) {
        return String(actual) !== String((expected as { $ne: unknown }).$ne);
      }
      return String(actual) === String(expected);
    });
  const query = <T>(value: T) => {
    const result = Object.assign(Promise.resolve(value), {
      session: () => result,
      sort: () => result,
    });
    return result;
  };

  t.mock.method(User, 'findById', () => Promise.resolve({ _id: userId, id: userId, isActive: true }));
  t.mock.method(Pharmacy, 'findOne', () => Promise.resolve({ _id: pharmacyId }));
  t.mock.method(PharmacyUser, 'findOne', () => Promise.resolve({ roleId: id() }));
  t.mock.method(Role, 'findById', () => Promise.resolve({ name: roleName, permissions: [] }));
  t.mock.method(Supplier, 'findOne', () => query({ _id: supplierId, status: 'ACTIVE' }));
  t.mock.method(MedicineCatalog, 'countDocuments', () => query(1));
  t.mock.method(PharmacyMedicine, 'countDocuments', () => query(1));
  t.mock.method(PurchaseOrder, 'findOne', () => query(null));
  t.mock.method(PurchaseOrderItem, 'find', () => query([]));
  t.mock.method(GRN, 'find', (filter: Record<string, unknown>) =>
    query(grns.filter(grn => matches(grn, filter))));
  t.mock.method(GRN, 'findOne', (filter: Record<string, unknown>) =>
    query(grns.find(grn => matches(grn, filter)) ?? null));
  t.mock.method(GRN, 'findOneAndUpdate', async (
    filter: Record<string, unknown>,
    update: { $set: Record<string, unknown> }
  ) => {
    const grn = grns.find(document => matches(document, filter));
    if (!grn) return null;
    grn.set(update.$set);
    return grn;
  });
  t.mock.method(GRN.prototype, 'save', async function (this: InstanceType<typeof GRN>) {
    grns.push(this);
    return this;
  });
  t.mock.method(GRNItem, 'find', (filter: Record<string, unknown>) =>
    query(items.filter(item => matches(item, filter))));
  t.mock.method(GRNItem, 'deleteMany', (filter: Record<string, unknown>) => {
    const retained = items.filter(item => !matches(item, filter));
    items.splice(0, items.length, ...retained);
    return query({ deletedCount: 0 });
  });
  t.mock.method(GRNItem.prototype, 'save', async function (this: InstanceType<typeof GRNItem>) {
    items.push(this);
    return this;
  });
  t.mock.method(mongoose, 'startSession', async () => ({
    withTransaction: async (callback: () => Promise<void>) => callback(),
    endSession: async () => {},
  }));

  const app = express();
  app.use(express.json());
  app.use('/api/v1/pharmacies/:pharmacyId/grns', grnRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const token = jwt.sign({ userId, pharmacyId }, process.env.JWT_SECRET!, { issuer: 'aidfast-api' });
  const body = {
    supplierId,
    invoiceNumber: 'INV-1',
    receivedDate: '2026-11-08',
    items: [{
      medicineId,
      batchNumber: 'BATCH-1',
      expiryDate: '2028-11-08',
      receivedQuantity: 10,
      rejectedQuantity: 3,
      wholesalePrice: '2.50',
    }],
  };
  const request = async (path: string, method = 'GET', payload?: object, pharmacy = pharmacyId) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/pharmacies/${pharmacy}/grns${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { status: response.status, body: await response.json() as { success: boolean; data?: Record<string, unknown> } };
  };

  const created = await request('', 'POST', body);
  assert.equal(created.status, 201);
  const grn = created.body.data!;
  assert.equal(grn.status, 'DRAFT');
  assert.match(String(grn.grnNumber), /^GRN-\d{8}-[A-F0-9]{16}$/);
  assert.equal((grn.items as Array<Record<string, unknown>>)[0].acceptedQuantity, 7);
  assert.equal(items[0].lineTotal?.toString(), '17.50');
  assert.equal(grns[0].totalAmount?.toString(), '17.50');
  const grnId = String(grn._id);

  assert.equal((await request(`/${grnId}/submit`, 'POST')).status, 403);
  const staffEdit = await request(`/${grnId}`, 'PUT', {
    ...body,
    items: [{ ...body.items[0], receivedQuantity: 12, rejectedQuantity: 2 }],
  });
  assert.equal(staffEdit.status, 200);
  assert.equal(items[0].acceptedQuantity, 10);
  assert.equal((await request(`/${grnId}`, 'PUT', {
    ...body,
    items: [{ ...body.items[0], receivedQuantity: -2 }],
  })).status, 400);
  assert.equal((await request('', 'GET', undefined, otherPharmacyId)).status, 403);
  assert.equal((await request('', 'POST', {
    ...body,
    items: [{ ...body.items[0], lineTotal: '18' }],
    totalAmount: '18',
  })).status, 400);

  roleName = 'PHARMACIST';
  const pharmacistEdit = await request(`/${grnId}`, 'PATCH', {
    ...body,
    items: [{ ...body.items[0], receivedQuantity: 14, rejectedQuantity: 4 }],
  });
  assert.equal(pharmacistEdit.status, 200);
  assert.equal(items[0].acceptedQuantity, 10);
  assert.equal((await request(`/${grnId}/submit`, 'POST')).status, 200);
  assert.equal(grns[0].status, 'PENDING_VERIFICATION');
  assert.equal((await request(`/${grnId}/submit`, 'POST')).status, 409);
  assert.equal((await request(`/${grnId}`, 'PUT', body)).status, 409);

  roleName = 'VERIFIER';
  assert.equal((await request('?status=PENDING_VERIFICATION')).status, 200);
  assert.equal((await request('', 'POST', body)).status, 403);
  assert.equal((await request(`/${grnId}/submit`, 'POST')).status, 403);
  assert.equal(grns[0].status, 'PENDING_VERIFICATION');
  assert.equal(items[0].acceptedQuantity, 10);

  roleName = 'ADMIN';
  const adminCreated = await request('', 'POST', body);
  assert.equal(adminCreated.status, 201);
  const adminGrnId = String(adminCreated.body.data!._id);
  assert.equal((await request(`/${adminGrnId}`, 'PUT', body)).status, 200);
  assert.equal((await request(`/${adminGrnId}/submit`, 'POST')).status, 200);
  assert.equal(grns[1].status, 'PENDING_VERIFICATION');
});

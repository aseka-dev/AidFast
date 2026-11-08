import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import supplierRoutes from '../routes/supplierRoutes';
import purchaseOrderRoutes from '../routes/purchaseOrderRoutes';
import User from '../models/User';
import Pharmacy from '../models/Pharmacy';
import PharmacyUser from '../models/PharmacyUser';
import Role from '../models/Role';
import Supplier from '../models/Supplier';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseOrderItem from '../models/PurchaseOrderItem';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import { purchaseOrderInput, supplierInput, multiplyDecimal, addDecimals } from '../services/purchasingValidation';

const id = () => new mongoose.Types.ObjectId().toString();
const pharmacyId = id(), otherPharmacy = id(), userId = id(), medicineId = id();
const validOrder = (supplierId: string) => ({ supplierId, purchaseOrderNumber: 'TEST-PO-1', orderDate: '2026-11-08', items: [{ medicineId, orderedQuantity: 3, unitPurchasePrice: '0.10' }] });

test('purchasing input validation and exact decimal totals', () => {
  assert.equal(multiplyDecimal('0.10', 3), '0.30');
  assert.equal(addDecimals(['0.10', '0.20']), '0.30');
  assert.equal(purchaseOrderInput.parse({ ...validOrder(id()), items: [{ medicineId, orderedQuantity: 1, unitPurchasePrice: 1e-7 }] }).items[0].unitPurchasePrice, '0.0000001');
  assert.equal(supplierInput.safeParse({ supplierName: '  ' }).success, false);
  assert.equal(supplierInput.safeParse({ supplierName: 42 }).success, false);
  const valid = validOrder(id());
  for (const items of [[], [{ ...valid.items[0], medicineId: 'invalid' }], [{ ...valid.items[0], orderedQuantity: 0 }], [{ ...valid.items[0], orderedQuantity: -1 }], [{ ...valid.items[0], orderedQuantity: Infinity }], [{ ...valid.items[0], unitPurchasePrice: '-1' }], [{ ...valid.items[0], unitPurchasePrice: 'NaN' }]]) {
    assert.equal(purchaseOrderInput.safeParse({ ...valid, items }).success, false);
  }
  assert.equal(purchaseOrderInput.safeParse({ ...valid, orderDate: 'bad' }).success, false);
});

test('purchasing HTTP routes: auth, pharmacy scope, CRUD, references, totals and rollback (model doubles)', async t => {
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'purchasing-test-secret';
  t.after(() => { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; });
  // These doubles exercise real routing/auth/controllers and model validation without touching a database.
  const suppliers: InstanceType<typeof Supplier>[] = [];
  const orders: InstanceType<typeof PurchaseOrder>[] = [];
  const orderItems: InstanceType<typeof PurchaseOrderItem>[] = [];
  const matches = (doc: unknown, filter: object) => Object.entries(filter).every(([key, value]) => String((doc as Record<string, unknown>)[key]) === String(value));
  const query = (value: unknown) => Object.assign(Promise.resolve(value), { sort: () => Promise.resolve(value), session: () => Promise.resolve(value) });
  t.mock.method(User, 'findById', () => Promise.resolve({ _id: userId, id: userId, isActive: true }));
  t.mock.method(Pharmacy, 'findOne', () => Promise.resolve({ _id: pharmacyId }));
  t.mock.method(PharmacyUser, 'findOne', () => Promise.resolve({ roleId: id() }));
  t.mock.method(Role, 'findById', () => Promise.resolve({ name: 'ADMIN', permissions: ['*'] }));
  t.mock.method(Supplier, 'find', (filter: object) => query(suppliers.filter(doc => matches(doc, filter))));
  t.mock.method(Supplier, 'findOne', (filter: object) => query(suppliers.find(doc => matches(doc, filter))));
  t.mock.method(Supplier, 'exists', (filter: object) => query(suppliers.find(doc => matches(doc, filter))));
  t.mock.method(Supplier, 'create', async (input: object) => { const doc = new Supplier(input); await doc.validate(); suppliers.push(doc); return doc; });
  t.mock.method(Supplier, 'findOneAndUpdate', async (filter: object, update: { $set: object }) => { const doc = suppliers.find(doc => matches(doc, filter)); if (doc) { doc.set(update.$set); await doc.validate(); } return doc; });
  t.mock.method(PurchaseOrder, 'find', (filter: object) => query(orders.filter(doc => matches(doc, filter))));
  t.mock.method(PurchaseOrder, 'findOne', (filter: object) => query(orders.find(doc => matches(doc, filter))));
  t.mock.method(PurchaseOrderItem, 'find', (filter: object) => query(orderItems.filter(doc => matches(doc, filter))));
  let catalogCount = 1, linkedCount = 1, failItem = false;
  let transactionUnsupported = false;
  t.mock.method(MedicineCatalog, 'countDocuments', () => query(catalogCount));
  t.mock.method(PharmacyMedicine, 'countDocuments', () => query(linkedCount));
  t.mock.method(PurchaseOrder.prototype, 'save', async function (this: InstanceType<typeof PurchaseOrder>) { orders.push(this); return this; });
  t.mock.method(PurchaseOrderItem.prototype, 'save', async function (this: InstanceType<typeof PurchaseOrderItem>) { if (failItem) throw new Error('Injected item failure'); orderItems.push(this); return this; });
  t.mock.method(mongoose, 'startSession', async () => ({
    withTransaction: async (callback: () => Promise<void>) => {
      if (transactionUnsupported) throw Object.assign(new Error('Transactions unavailable'), { code: 20 });
      const orderCount = orders.length, itemCount = orderItems.length;
      try { await callback(); } catch (error) { orders.length = orderCount; orderItems.length = itemCount; throw error; }
    }, endSession: async () => {},
  }));
  const app = express(); app.use(express.json());
  app.use('/api/v1/pharmacies/:pharmacyId/suppliers', supplierRoutes);
  app.use('/api/v1/pharmacies/:pharmacyId/purchase-orders', purchaseOrderRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const token = jwt.sign({ userId, pharmacyId }, process.env.JWT_SECRET!, { issuer: 'aidfast-api' });
  const request = async (path: string, method = 'GET', body?: object, auth: string | null = token, pharmacy = pharmacyId) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/pharmacies/${pharmacy}/${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
  await t.test('missing/invalid JWT, pharmacy selection and cross-pharmacy URL', async () => {
    for (const path of ['suppliers', 'purchase-orders']) {
      assert.equal((await request(path, 'GET', undefined, null)).status, 401);
      assert.equal((await request(path, 'GET', undefined, 'bad')).status, 401);
      assert.equal((await request(path, 'GET', undefined, token, otherPharmacy)).status, 403);
      const unselected = jwt.sign({ userId }, process.env.JWT_SECRET!, { issuer: 'aidfast-api' });
      assert.equal((await request(path, 'GET', undefined, unselected)).status, 400);
    }
  });
  let supplierId = '';
  await t.test('supplier create/list/get/update and isolation', async () => {
    assert.equal((await request('suppliers', 'POST', { supplierName: ' ' })).status, 400);
    const created = await request('suppliers', 'POST', { supplierName: ' Test Distributor ', pharmacyId: otherPharmacy });
    assert.equal(created.status, 201); supplierId = created.body.data._id;
    assert.equal(created.body.data.pharmacyId, pharmacyId);
    assert.equal((await request('suppliers')).body.data.length, 1);
    assert.equal((await request(`suppliers/${supplierId}`)).status, 200);
    assert.equal((await request(`suppliers/${supplierId}`, 'PUT', { contact: '555', pharmacyId: otherPharmacy })).body.data.contact, '555');
    assert.equal((await request('suppliers/bad')).status, 400);
    const foreign = new Supplier({ pharmacyId: otherPharmacy, supplierName: 'Foreign' }); suppliers.push(foreign);
    assert.equal((await request(`suppliers/${foreign.id}`)).status, 404);
    assert.equal((await request(`suppliers/${foreign.id}`, 'PUT', { supplierName: 'Changed' })).status, 404);
    assert.equal((await request('suppliers')).body.data.length, 1);
  });
  await t.test('purchase order create/list/get and isolation', async () => {
    const created = await request('purchase-orders', 'POST', validOrder(supplierId));
    assert.equal(created.status, 201); assert.equal(created.body.data.totalAmount.$numberDecimal, '0.30');
    assert.equal(created.body.data.items.length, 1);
    assert.equal((await request('purchase-orders')).body.data.length, 1);
    assert.equal((await request(`purchase-orders/${created.body.data._id}`)).body.data.items.length, 1);
    orders.push(new PurchaseOrder({ pharmacyId: otherPharmacy, supplierId, purchaseOrderNumber: 'FOREIGN', orderDate: new Date() }));
    assert.equal((await request(`purchase-orders/${orders[1].id}`)).status, 404);
    assert.equal((await request('purchase-orders')).body.data.length, 1);
    assert.equal((await request('purchase-orders/bad')).status, 400);
  });
  await t.test('invalid/foreign supplier, catalog references, pharmacy links, items and totals', async () => {
    for (const supplier of [id(), suppliers[1].id, 'bad']) assert.equal((await request('purchase-orders', 'POST', validOrder(supplier))).status, 400);
    const valid = validOrder(supplierId);
    for (const changes of [{ items: [] }, { items: [{ ...valid.items[0], orderedQuantity: 0 }] }, { items: [{ ...valid.items[0], unitPurchasePrice: '-1' }] }, { totalAmount: '9' }, { items: [{ ...valid.items[0], lineTotal: '9' }] }]) {
      assert.equal((await request('purchase-orders', 'POST', { ...valid, ...changes })).status, 400);
    }
    catalogCount = 0; assert.equal((await request('purchase-orders', 'POST', valid)).status, 400); catalogCount = 1;
    linkedCount = 0; assert.equal((await request('purchase-orders', 'POST', valid)).status, 400); linkedCount = 1;
  });
  await t.test('item-write failure rolls back order and items through transaction', async () => {
    const before = [orders.length, orderItems.length]; failItem = true;
    assert.equal((await request('purchase-orders', 'POST', validOrder(supplierId))).status, 500);
    assert.deepEqual([orders.length, orderItems.length], before);
  });
  await t.test('standalone MongoDB fails safely before any writes', async () => {
    const before = [orders.length, orderItems.length]; transactionUnsupported = true;
    assert.equal((await request('purchase-orders', 'POST', validOrder(supplierId))).status, 503);
    assert.deepEqual([orders.length, orderItems.length], before);
  });
});

// Opt-in only: never reuse the configured application database or load backend/.env.
test('real MongoDB persistence and atomic rollback in a disposable database', {
  skip: !process.env.AIDFAST_TEST_MONGODB_URI ? 'AIDFAST_TEST_MONGODB_URI is not set; no disposable transaction-capable MongoDB configured' : false,
}, async t => {
  const databaseName = `aidfast_purchasing_test_${new mongoose.Types.ObjectId()}`;
  await mongoose.connect(process.env.AIDFAST_TEST_MONGODB_URI!, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    try {
      assert.equal(mongoose.connection.name, databaseName);
      await mongoose.connection.dropDatabase();
    } finally { await mongoose.disconnect(); }
  });
  await Promise.all([Supplier.init(), PurchaseOrder.init(), PurchaseOrderItem.init(), MedicineCatalog.init(), PharmacyMedicine.init()]);
  const supplier = await Supplier.create({ pharmacyId, supplierName: 'Disposable purchasing test supplier' });
  await MedicineCatalog.create({ _id: medicineId, medicineCode: `TEST-${medicineId}`, medicineName: 'Test medicine', category: 'TEST', manufacturer: 'TEST', packSize: '1' });
  await PharmacyMedicine.create({ pharmacyId, medicineId });
  const { createPurchaseOrder } = await import('../controllers/purchasingController');
  const app = express(); app.use(express.json());
  app.post('/orders', (req, res) => createPurchaseOrder(Object.assign(req, { user: { userId, pharmacyId } }), res));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const create = (body: object) => fetch(`http://127.0.0.1:${address.port}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const input = validOrder(supplier.id);
  assert.equal((await create(input)).status, 201);
  assert.equal(await PurchaseOrder.countDocuments({ pharmacyId }), 1);
  assert.equal(await PurchaseOrderItem.countDocuments({ pharmacyId }), 1);
  assert.equal((await PurchaseOrder.findOne({ pharmacyId }))?.totalAmount?.toString(), '0.30');
  assert.equal((await create(input)).status, 409);
  assert.equal(await PurchaseOrderItem.countDocuments({ pharmacyId }), 1);
  t.mock.method(PurchaseOrderItem.prototype, 'save', async () => { throw new Error('Injected persistence failure'); });
  assert.equal((await create({ ...input, purchaseOrderNumber: 'ROLLBACK-TEST' })).status, 500);
  assert.equal(await PurchaseOrder.countDocuments({ purchaseOrderNumber: 'ROLLBACK-TEST' }), 0);
  assert.equal(await PurchaseOrderItem.countDocuments({ pharmacyId }), 1);
});

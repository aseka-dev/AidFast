import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import StockMovement from '../models/StockMovement';
import StockAdjustment from '../models/StockAdjustment';
import PublicAvailabilitySnapshot from '../models/PublicAvailabilitySnapshot';

const id = () => new mongoose.Types.ObjectId();
const base = () => ({ pharmacyId: id(), medicineId: id(), batchId: id(), performedBy: id(),
  movementType: 'GRN_RECEIPT', quantityDelta: 40, quantityBefore: 0, quantityAfter: 40,
  reason: 'Demo GRN receipt', referenceType: 'GRNItem', referenceId: id(), idempotencyKey: 'M2TEST-1' });

test('StockMovement validates successful stock posting and rejects inconsistent quantities', async () => {
  await new StockMovement(base()).validate();
  await assert.rejects(() => new StockMovement({ ...base(), quantityAfter: 10 }).validate());
  await assert.rejects(() => new StockMovement({ ...base(), quantityDelta: 0 }).validate());
});

test('StockAdjustment requires nonzero quantity and approver for APPROVED', async () => {
  const draft = { pharmacyId: id(), batchId: id(), adjustmentNumber: 'ADJ-TEST',
    adjustmentType: 'STOCK_COUNT', quantityDelta: -3, reason: 'Physical count mismatch', createdBy: id() };
  await new StockAdjustment(draft).validate();
  await assert.rejects(() => new StockAdjustment({ ...draft, quantityDelta: 0 }).validate());
  await assert.rejects(() => new StockAdjustment({ ...draft, approvalStatus: 'APPROVED' }).validate());
  await new StockAdjustment({ ...draft, approvalStatus: 'APPROVED', approvedBy: id(), approvedAt: new Date() }).validate();
});

test('PublicAvailabilitySnapshot stores no exact stock quantity', async () => {
  const snap = new PublicAvailabilitySnapshot({ pharmacyId: id(), medicineId: id(), availabilityStatus: 'LOW_AVAILABILITY', isPubliclyVisible: true, sourceVersion: 3 });
  await snap.validate();
  assert.equal(Object.prototype.hasOwnProperty.call(snap.toObject(), 'currentQuantity'), false);
  await assert.rejects(() => new PublicAvailabilitySnapshot({ pharmacyId: id(), medicineId: id(), availabilityStatus: 'INVALID' }).validate());
});

test('unique tenant indexes are declared in schemas (database enforces them)', () => {
  const findUnique = (indexes: ReturnType<typeof StockMovement.schema.indexes>, keys: Record<string, number>) =>
    indexes.some(([fields, options]) =>
      options?.unique === true && Object.keys(keys).every(k => fields[k] === keys[k]));
  assert.equal(findUnique(StockMovement.schema.indexes(), { pharmacyId: 1, idempotencyKey: 1 }), true);
  assert.equal(findUnique(StockAdjustment.schema.indexes(), { pharmacyId: 1, adjustmentNumber: 1 }), true);
  assert.equal(findUnique(PublicAvailabilitySnapshot.schema.indexes(), { pharmacyId: 1, medicineId: 1 }), true);
});

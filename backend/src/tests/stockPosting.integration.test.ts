import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Batch from '../models/Batch';
import StockMovement from '../models/StockMovement';
import Grn from '../models/Grn';
import GrnItem from '../models/GrnItem';
import { stockPostingService } from '../services/stockPostingService';
import type { StockPostingCommand } from '../contracts/stockPosting';

// This MUST run only against a dedicated QA MongoDB replica-set database.
// It will never read the backend's normal MONGO_URI or .env automatically.
const uri = process.env.M2_D7_TEST_URI;
const dbName = uri ? new URL(uri).pathname.slice(1).split('?')[0] : '';
const safeTestTarget = Boolean(uri) && dbName === 'aidfast_d7_test';

test('Central stock posting: actual MongoDB transactions and tenancy', { skip: !safeTestTarget }, async () => {
  if (!uri || !safeTestTarget) throw new Error('Set M2_D7_TEST_URI to a dedicated aidfast_d7_test database');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  const p1 = new mongoose.Types.ObjectId();
  const p2 = new mongoose.Types.ObjectId();
  const medicineId = new mongoose.Types.ObjectId();
  const supplierId = new mongoose.Types.ObjectId();
  const createdBy = new mongoose.Types.ObjectId();
  const verifiedBy = new mongoose.Types.ObjectId();
  const batchId = new mongoose.Types.ObjectId();
  const grnId = new mongoose.Types.ObjectId();
  const grnItemId = new mongoose.Types.ObjectId();
  const testRun = new mongoose.Types.ObjectId().toString();
  const expires = new Date('2030-12-31T00:00:00.000Z');

  try {
    await StockMovement.init();
    await Batch.init();
    await Grn.create({
      _id: grnId, pharmacyId: p1, supplierId, grnNumber: `D7-${testRun}`,
      receivedDate: new Date('2026-11-09T00:00:00.000Z'),
      status: 'PENDING_VERIFICATION', inventoryPosted: false,
      createdBy, verifiedBy, verifiedAt: new Date()
    });
    await GrnItem.create({
      _id: grnItemId, pharmacyId: p1, grnId, medicineId, batchId,
      batchNumber: `D7-${testRun}`,
      expiryDate: expires, receivedQuantity: 10, rejectedQuantity: 0,
      unitOfMeasure: 'tablet'
    });
    await Batch.create({
      _id: batchId, pharmacyId: p1, medicineId, supplierId, grnItemId,
      batchNumber: `D7-${testRun}`, receivedDate: new Date(),
      expiryDate: expires, initialQuantity: 0, currentQuantity: 0,
      unitOfMeasure: 'tablet', batchStatus: 'ACTIVE', safetyStatus: 'CLEAR'
    });

    const receipt: StockPostingCommand = {
      pharmacyId: p1.toString(), medicineId: medicineId.toString(), batchId: batchId.toString(),
      performedById: verifiedBy.toString(), movementType: 'GRN_RECEIPT', quantityDelta: 10,
      referenceType: 'GRN_ITEM', referenceId: grnItemId.toString(),
      idempotencyKey: `qa:${testRun}:receipt`
    };
    const received = await stockPostingService.post(receipt);
    assert.equal(received.applied, true);
    assert.equal(received.quantityAfter, 10);

    const retry = await stockPostingService.post(receipt);
    assert.equal(retry.applied, false);
    assert.equal(retry.quantityAfter, 10);
    await assert.rejects(stockPostingService.post({ ...receipt, quantityDelta: 11 }), /Idempotency key reused/);

    const sale: StockPostingCommand = {
      ...receipt, movementType: 'SALE', quantityDelta: -4,
      referenceType: 'SALE_ITEM', referenceId: new mongoose.Types.ObjectId().toString(),
      idempotencyKey: `qa:${testRun}:sale`
    };
    const sold = await stockPostingService.post(sale);
    assert.equal(sold.quantityBefore, 10);
    assert.equal(sold.quantityAfter, 6);

    await assert.rejects(stockPostingService.post({ ...sale,
      quantityDelta: -7, referenceId: new mongoose.Types.ObjectId().toString(),
      idempotencyKey: `qa:${testRun}:oversell`
    }), /Insufficient stock/);

    await assert.rejects(stockPostingService.post({ ...sale,
      pharmacyId: p2.toString(), idempotencyKey: `qa:${testRun}:other-pharmacy`
    }), /Batch not found/);

    await Batch.updateOne({ _id: batchId }, { $set: { batchStatus: 'BLOCKED' } });
    await assert.rejects(stockPostingService.post({ ...sale,
      referenceId: new mongoose.Types.ObjectId().toString(),
      idempotencyKey: `qa:${testRun}:blocked`
    }), /not eligible for sale/);

    const finalBatch = await Batch.findById(batchId);
    assert.equal(finalBatch?.currentQuantity, 6);
    assert.equal(finalBatch?.initialQuantity, 10, 'Original GRN receipt should set initial quantity');
    const ledger = await StockMovement.find({ pharmacyId: p1, batchId });
    assert.equal(ledger.length, 2, 'receipt and sale exactly once each');
    assert.deepEqual(ledger.map(m => m.quantityDelta).sort((a, b) => a - b), [-4, 10]);
  } finally {
    await StockMovement.collection.deleteMany({ batchId });
    await Batch.collection.deleteMany({ _id: batchId });
    await GrnItem.collection.deleteMany({ _id: grnItemId });
    await Grn.collection.deleteMany({ _id: grnId });
    await mongoose.disconnect();
  }
});

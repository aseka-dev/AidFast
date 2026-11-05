
import test from 'node:test';
import assert from 'node:assert/strict';

import { GRN_STATUS } from '../constants/grnStatus';

import {
  confirmGrnWithStockService,
  type ConfirmableGrn
} from '../services/grnConfirmation';

import type {
  GrnStockService,
  GrnStockPostingRequest
} from '../contracts/grnStock.contract';

const createGrn = (
  status: ConfirmableGrn['status'] =
    GRN_STATUS.PENDING_VERIFICATION
): ConfirmableGrn => ({
  _id: 'grn-test-id',
  pharmacyId: 'pharmacy-test-id',
  status,
  inventoryPosted: false,
  items: [
    {
      medicineId: 'medicine-test-id',
      batchNumber: 'batch-test',
      expiryDate: '2027-12-31',
      acceptedQuantity: 10,
      wholesalePrice: 100
    }
  ]
});

const createMockStockService = () => {
  const calls: GrnStockPostingRequest[] = [];

  const service: GrnStockService = {
    async postConfirmedGrn(request) {
      calls.push(request);

      return {
        grnId: request.grnId,
        posted: true
      };
    }
  };

  return { service, calls };
};

test('Draft GRN does not post stock', async () => {
  const { service, calls } = createMockStockService();

  await assert.rejects(
    confirmGrnWithStockService(
      createGrn(GRN_STATUS.DRAFT),
      service
    ),
    /Invalid GRN status transition/
  );

  assert.equal(calls.length, 0);
});

test('Changes requested GRN does not post stock', async () => {
  const { service, calls } = createMockStockService();

  await assert.rejects(
    confirmGrnWithStockService(
      createGrn(GRN_STATUS.CHANGES_REQUESTED),
      service
    )
  );

  assert.equal(calls.length, 0);
});

test('Pending GRN posts accepted stock exactly once', async () => {
  const { service, calls } = createMockStockService();

  const result = await confirmGrnWithStockService(
    createGrn(),
    service
  );

  assert.equal(calls.length, 1);
  assert.equal(result.status, GRN_STATUS.CONFIRMED);
  assert.equal(result.inventoryPosted, true);
  assert.equal(calls[0].items[0].acceptedQuantity, 10);
});

test('Duplicate confirmation does not post stock again', async () => {
  const { service, calls } = createMockStockService();

  const confirmed = await confirmGrnWithStockService(
    createGrn(),
    service
  );

  await assert.rejects(
    confirmGrnWithStockService(confirmed, service)
  );

  assert.equal(calls.length, 1);
});

test('Stock posting failure does not confirm GRN', async () => {
  const grn = createGrn();

  const failingService: GrnStockService = {
    async postConfirmedGrn() {
      throw new Error('Stock service unavailable');
    }
  };

  await assert.rejects(
    confirmGrnWithStockService(grn, failingService),
    /Stock service unavailable/
  );

  assert.equal(grn.status, GRN_STATUS.PENDING_VERIFICATION);
  assert.equal(grn.inventoryPosted, false);
});

test('Confirmation passes a stable idempotency key', async () => {
  const { service, calls } = createMockStockService();

  await confirmGrnWithStockService(
    createGrn(),
    service
  );

  assert.equal(
    calls[0].idempotencyKey,
    'grn:grn-test-id:stock-in'
  );
});

test('Confirmation rejects GRN without items', async () => {
  const { service, calls } = createMockStockService();

  await assert.rejects(
    confirmGrnWithStockService(
      { ...createGrn(), items: [] },
      service
    ),
    /at least one item/
  );

  assert.equal(calls.length, 0);
});

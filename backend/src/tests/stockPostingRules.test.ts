import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStockPostingCommand, calculateNewQuantity, samePosting } from '../services/stockPostingRules';
import type { StockPostingCommand } from '../contracts/stockPosting';

const command = (overrides: Partial<StockPostingCommand> = {}): StockPostingCommand => ({
  pharmacyId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  medicineId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  batchId: 'cccccccccccccccccccccccc',
  performedById: 'dddddddddddddddddddddddd',
  movementType: 'SALE', quantityDelta: -3,
  referenceType: 'SALE_ITEM', referenceId: 'eeeeeeeeeeeeeeeeeeeeeeee',
  idempotencyKey: 'sale:unique-case-1', ...overrides
});

test('valid stock-out is accepted', () => assert.doesNotThrow(() => validateStockPostingCommand(command())));
test('sale cannot add stock', () => assert.throws(() => validateStockPostingCommand(command({ quantityDelta: 3 })), /decrease stock/));
test('GRN receipt must add stock', () => assert.throws(() => validateStockPostingCommand(command({ movementType: 'GRN_RECEIPT', referenceType: 'GRN_ITEM', quantityDelta: -2 })), /increase stock/));
test('fractional stock cannot be posted', () => assert.throws(() => validateStockPostingCommand(command({ quantityDelta: -1.5 })), /safe integer/));
test('zero movement is rejected', () => assert.throws(() => validateStockPostingCommand(command({ quantityDelta: 0 })), /non-zero/));
test('GRN receipt must identify GRN item', () => assert.throws(() => validateStockPostingCommand(command({ movementType: 'GRN_RECEIPT', quantityDelta: 5 })), /GRN_ITEM/));
test('invalid pharmacy id is rejected', () => assert.throws(() => validateStockPostingCommand(command({ pharmacyId: 'wrong' })), /ObjectId/));
test('insufficient physical stock is rejected', () => assert.throws(() => calculateNewQuantity(2, -3), /Insufficient stock/));
test('stock balances update correctly', () => assert.equal(calculateNewQuantity(10, -4), 6));
test('idempotency comparison rejects altered operation', () => {
  const first = command();
  assert.equal(samePosting(first, first as unknown as Record<string, unknown>), true);
  assert.equal(samePosting(command({ quantityDelta: -4 }), first as unknown as Record<string, unknown>), false);
});

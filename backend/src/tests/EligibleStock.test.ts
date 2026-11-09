import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleQuantity, isEligibleLot, colomboToday, availabilityStatusFromQuantity, createPublicAvailabilityProjection, type EligibleStockLot } from '../services/eligibleStock';

const time = new Date('2026-11-05T12:00:00.000Z');
const make = (overrides: Partial<EligibleStockLot> = {}): EligibleStockLot => ({
  pharmacyId: 'P1', medicineId: 'M1', currentQuantity: 20,
  batchStatus: 'ACTIVE', safetyStatus: 'CLEAR', expiryDate: new Date('2028-04-30T00:00:00.000Z'), ...overrides
});

test('valid, safe ACTIVE stock is available', () => {
  assert.equal(isEligibleLot(make(), time), true);
  assert.equal(eligibleQuantity([make(), make({ currentQuantity: 4 })], 'P1', 'M1', time), 24);
});

test('expired, blocked, quarantined, under-review and notice-matched lots are excluded', () => {
  const invalid: EligibleStockLot[] = [
    make({ currentQuantity: 13, expiryDate: new Date('2026-11-04T00:00:00.000Z') }),
    make({ batchStatus: 'BLOCKED' }),
    make({ batchStatus: 'QUARANTINED' }),
    make({ safetyStatus: 'UNDER_REVIEW' }),
    make({ safetyStatus: 'MATCHED' }),
    make({ batchStatus: 'EXPIRED' }),
    make({ batchStatus: 'DEPLETED' }),
    make({ currentQuantity: 0 }),
    make({ currentQuantity: -8 }),
    make({ currentQuantity: 1.5 })
  ];
  invalid.forEach(lot => assert.equal(isEligibleLot(lot, time), false));
  assert.equal(eligibleQuantity([...invalid, make({ currentQuantity: 6 })], 'P1', 'M1', time), 6);
});

test('lots are separated by pharmacy and medicine (tenant scope)', () => {
  assert.equal(eligibleQuantity([make(), make({ pharmacyId: 'P2' }), make({ medicineId: 'M2' })], 'P1', 'M1', time), 20);
  assert.equal(eligibleQuantity([make()], 'P2', 'M1', time), 0);
});

test('expiry uses Asia/Colombo calendar date, including date boundaries', () => {
  const midnightLocal = new Date('2026-11-04T18:30:00.000Z'); // 2026-11-05 00:00 in Colombo
  assert.equal(colomboToday(midnightLocal), '2026-11-05');
  assert.equal(isEligibleLot(make({ expiryDate: new Date('2026-11-05T00:00:00.000Z') }), midnightLocal), true);
  assert.equal(isEligibleLot(make({ expiryDate: new Date('2026-11-04T00:00:00.000Z') }), midnightLocal), false);
});

test('resolved safety condition may sell only when batch is active', () => {
  assert.equal(isEligibleLot(make({ safetyStatus: 'RESOLVED' }), time), true);
  assert.equal(isEligibleLot(make({ safetyStatus: 'RESOLVED', batchStatus: 'BLOCKED' }), time), false);
});

test('public availability threshold and no-exact-quantity projection', () => {
  assert.equal(availabilityStatusFromQuantity(0, 10), 'OUT_OF_STOCK');
  assert.equal(availabilityStatusFromQuantity(10, 10), 'LOW_AVAILABILITY');
  assert.equal(availabilityStatusFromQuantity(11, 10), 'AVAILABLE');
  assert.throws(() => availabilityStatusFromQuantity(-1, 10));
  const result = createPublicAvailabilityProjection([make()], 'P1', 'M1', 10, true, time);
  assert.equal(result.availabilityStatus, 'AVAILABLE');
  assert.equal('quantity' in result, false);
});

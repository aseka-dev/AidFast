
import test from "node:test";
import assert from "node:assert/strict";
import { allocateFIFO, AvailableBatch } from "../services/fifoService";

const batch = (
  id: string,
  quantity: number,
  received: string,
  overrides: Partial<AvailableBatch> = {}
): AvailableBatch => ({
  batchId: id,
  receivedDate: new Date(received),
  expiryDate: new Date("2028-12-31"),
  quantityAvailable: quantity,
  unitPrice: 15,
  status: "AVAILABLE",
  safetyStatus: "CLEAR",
  ...overrides
});

const today = new Date("2026-11-14");

test("uses oldest received batch first", () => {
  const result = allocateFIFO([
    batch("b", 10, "2026-02-01"),
    batch("a", 10, "2026-01-01")
  ], 5, today);

  assert.deepEqual(
    result.map(x => [x.batchId, x.quantity]),
    [["a", 5]]
  );
});

test("splits quantity across batches", () => {
  const result = allocateFIFO([
    batch("a", 3, "2026-01-01"),
    batch("b", 8, "2026-02-01")
  ], 7, today);

  assert.deepEqual(
    result.map(x => [x.batchId, x.quantity]),
    [["a", 3], ["b", 4]]
  );
});

test("uses batch ID to break receipt date ties", () => {
  const result = allocateFIFO([
    batch("b", 5, "2026-01-01"),
    batch("a", 5, "2026-01-01")
  ], 2, today);

  assert.equal(result[0].batchId, "a");
});

test("rejects blocked and expired stock", () => {
  assert.throws(() => allocateFIFO([
    batch("a", 10, "2026-01-01", {
      status: "BLOCKED"
    }),
    batch("b", 10, "2026-01-01", {
      expiryDate: new Date("2025-01-01")
    })
  ], 1, today), /Insufficient/);
});

test("rejects unsafe stock", () => {
  assert.throws(() => allocateFIFO([
    batch("a", 10, "2026-01-01", {
      safetyStatus: "MATCHED"
    })
  ], 1, today), /Insufficient/);
});

test("rejects insufficient stock", () => {
  assert.throws(() => allocateFIFO([
    batch("a", 2, "2026-01-01")
  ], 5, today), /Insufficient/);
});

test("rejects invalid quantity", () => {
  assert.throws(() => allocateFIFO([], 0, today));
  assert.throws(() => allocateFIFO([], -1, today));
  assert.throws(() => allocateFIFO([], 1.5, today));
});

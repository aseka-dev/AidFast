
import test from "node:test";
import assert from "node:assert/strict";

import {
  allocateFIFO,
  AvailableBatch
} from "../services/fifoService";

const batches: AvailableBatch[] = [
  {
    batchId: "B001",
    receivedDate: new Date("2026-01-01"),
    expiryDate: new Date("2027-12-31"),
    quantityAvailable: 5,
    unitPrice: 10,
    status: "AVAILABLE"
  },
  {
    batchId: "B002",
    receivedDate: new Date("2026-01-05"),
    expiryDate: new Date("2027-12-31"),
    quantityAvailable: 10,
    unitPrice: 10,
    status: "AVAILABLE"
  },
  {
    batchId: "B003",
    receivedDate: new Date("2026-01-08"),
    expiryDate: new Date("2027-12-31"),
    quantityAvailable: 20,
    unitPrice: 10,
    status: "BLOCKED"
  }
];

const today = new Date("2026-11-05");

test("FIFO selects oldest batches first", () => {
  const result = allocateFIFO(batches, 12, today);

  assert.deepEqual(
    result.map(({ batchId, quantity }) => ({
      batchId,
      quantity
    })),
    [
      { batchId: "B001", quantity: 5 },
      { batchId: "B002", quantity: 7 }
    ]
  );
});

test("FIFO skips blocked batches", () => {
  const result = allocateFIFO(batches, 15, today);

  assert.equal(
    result.some((item) => item.batchId === "B003"),
    false
  );
});

test("FIFO rejects insufficient stock", () => {
  assert.throws(
    () => allocateFIFO(batches, 20, today),
    /Insufficient available stock/
  );
});

test("FIFO rejects invalid quantity", () => {
  assert.throws(
    () => allocateFIFO(batches, 0, today),
    /Invalid requested quantity/
  );
});

test("FIFO skips expired batches", () => {
  const expiredBatches: AvailableBatch[] = [
    {
      ...batches[0],
      expiryDate: new Date("2025-12-31")
    },
    batches[1]
  ];

  const result = allocateFIFO(
    expiredBatches,
    5,
    today
  );

  assert.equal(result[0].batchId, "B002");
});

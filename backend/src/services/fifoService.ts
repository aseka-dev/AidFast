
export interface AvailableBatch {
  batchId: string;
  receivedDate: Date;
  expiryDate: Date;
  quantityAvailable: number;
  unitPrice: number;
  status: "AVAILABLE" | "BLOCKED" | "QUARANTINED";
}

export interface FIFOAllocation {
  batchId: string;
  quantity: number;
  unitPrice: number;
}

export const allocateFIFO = (
  batches: AvailableBatch[],
  requestedQuantity: number,
  today: Date = new Date()
): FIFOAllocation[] => {
  if (
    !Number.isInteger(requestedQuantity) ||
    requestedQuantity <= 0
  ) {
    throw new Error("Invalid requested quantity");
  }

  const eligibleBatches = batches
    .filter(
      (batch) =>
        batch.status === "AVAILABLE" &&
        batch.quantityAvailable > 0 &&
        batch.expiryDate >= today
    )
    .sort(
      (a, b) =>
        a.receivedDate.getTime() -
          b.receivedDate.getTime() ||
        a.batchId.localeCompare(b.batchId)
    );

  let remaining = requestedQuantity;
  const allocations: FIFOAllocation[] = [];

  for (const batch of eligibleBatches) {
    if (remaining === 0) break;

    const quantity = Math.min(
      remaining,
      batch.quantityAvailable
    );

    allocations.push({
      batchId: batch.batchId,
      quantity,
      unitPrice: batch.unitPrice
    });

    remaining -= quantity;
  }

  if (remaining > 0) {
    throw new Error("Insufficient available stock");
  }

  return allocations;
};

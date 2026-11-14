
import { colomboToday } from "./eligibleStock";

export interface AvailableBatch {
  batchId: string;
  receivedDate: Date;
  expiryDate: Date;
  quantityAvailable: number;
  unitPrice: number;
  status: "AVAILABLE" | "BLOCKED" | "QUARANTINED";
  safetyStatus?: "CLEAR" | "UNDER_REVIEW" | "MATCHED" | "RESOLVED";
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
    !Number.isSafeInteger(requestedQuantity) ||
    requestedQuantity <= 0
  ) {
    throw new Error("Invalid requested quantity");
  }

  const businessDate = colomboToday(today);

  const eligible = batches
    .filter((batch) =>
      batch.status === "AVAILABLE" &&
      (batch.safetyStatus === undefined ||
        ["CLEAR", "RESOLVED"].includes(batch.safetyStatus)) &&
      Number.isSafeInteger(batch.quantityAvailable) &&
      batch.quantityAvailable > 0 &&
      !Number.isNaN(batch.receivedDate.getTime()) &&
      !Number.isNaN(batch.expiryDate.getTime()) &&
      batch.expiryDate.toISOString().slice(0, 10) >= businessDate
    )
    .sort((a, b) =>
      a.receivedDate.getTime() - b.receivedDate.getTime() ||
      a.batchId.localeCompare(b.batchId)
    );

  let remaining = requestedQuantity;
  const allocations: FIFOAllocation[] = [];

  for (const batch of eligible) {
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

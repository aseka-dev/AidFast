// D3 CONTRACT ONLY: implementation belongs to M2 in later sprint days.
// Use a MongoDB transaction and immutable StockMovement record for actual posting.

export type MovementType =
  | 'GRN_RECEIPT'
  | 'SALE'
  | 'CUSTOMER_RETURN'
  | 'DISTRIBUTOR_RETURN'
  | 'DAMAGE'
  | 'EXPIRY'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export interface StockPostingCommand {
  pharmacyId: string;        // authorized tenant determined/verified server-side
  medicineId: string;
  batchId: string;
  quantityDelta: number;     // signed integer; quantity in base dispensing unit
  movementType: MovementType;
  referenceType: string;     // 'GRNItem' | 'SaleItemAllocation' | 'ReturnItem' etc.
  referenceId: string;
  idempotencyKey: string;    // stable key for logical operation, NOT per HTTP retry
  performedById: string;
  reason?: string;
}

export interface StockPostingResult {
  movementId: string;
  batchId: string;
  quantityBefore: number;
  quantityAfter: number;
  applied: boolean;         // false if an identical idempotent request was already posted
  batchStatus: 'ACTIVE' | 'BLOCKED' | 'QUARANTINED' | 'EXPIRED' | 'DEPLETED';
}

export interface IStockPostingService {
  post(command: StockPostingCommand): Promise<StockPostingResult>;
}

// Validation contract: reject cross-pharmacy references, noninteger or zero deltas,
// negative resulting balance, expired/blocked/quarantined sale, unconfirmed GRN,
// conflicting idempotency key reuse; apply once and update availability snapshots.

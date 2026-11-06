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
  pharmacyId: string;        
  medicineId: string;
  batchId: string;
  quantityDelta: number;     
  movementType: MovementType;
  referenceType: string;     
  referenceId: string;
  idempotencyKey: string;    
  performedById: string;
  reason?: string;
}

export interface StockPostingResult {
  movementId: string;
  batchId: string;
  quantityBefore: number;
  quantityAfter: number;
  applied: boolean;         
  batchStatus: 'ACTIVE' | 'BLOCKED' | 'QUARANTINED' | 'EXPIRED' | 'DEPLETED';
}

export interface IStockPostingService {
  post(command: StockPostingCommand): Promise<StockPostingResult>;
}
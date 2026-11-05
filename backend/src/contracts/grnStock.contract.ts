
export interface GrnStockItem {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  acceptedQuantity: number;
  wholesalePrice: number;
}

export interface GrnStockPostingRequest {
  pharmacyId: string;
  grnId: string;
  idempotencyKey: string;
  items: GrnStockItem[];
}

export interface GrnStockPostingResult {
  grnId: string;
  posted: boolean;
}

export interface GrnStockService {
  postConfirmedGrn(
    request: GrnStockPostingRequest
  ): Promise<GrnStockPostingResult>;
}

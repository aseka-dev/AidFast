export interface GrnItem {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  rejectedQuantity: number;
  wholesalePrice: number;
}

export const emptyItem = (): GrnItem => ({
  medicineId: '',
  batchNumber: '',
  expiryDate: '',
  receivedQuantity: 0,
  damagedQuantity: 0,
  returnedQuantity: 0,
  rejectedQuantity: 0,
  wholesalePrice: 0
});

export const accepted = (item: GrnItem): number =>
  Math.max(0, item.receivedQuantity - item.rejectedQuantity);

export const calculateGrnTotal = (items: GrnItem[]): number =>
  items.reduce(
    (sum, item) => sum + accepted(item) * item.wholesalePrice,
    0
  );


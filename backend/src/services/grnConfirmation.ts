
import {
  canChangeGRNStatus,
  GRN_STATUS,
  type GRNStatus
} from '../constants/grnStatus';

import type {
  GrnStockService,
  GrnStockItem
} from '../contracts/grnStock.contract';

export interface ConfirmableGrn {
  _id: string;
  pharmacyId: string;
  status: GRNStatus;
  inventoryPosted: boolean;
  items: GrnStockItem[];
}

export const confirmGrnWithStockService = async (
  grn: ConfirmableGrn,
  stockService: GrnStockService
): Promise<ConfirmableGrn> => {
  if (
    !canChangeGRNStatus(
      grn.status,
      GRN_STATUS.CONFIRMED
    )
  ) {
    throw new Error('Invalid GRN status transition');
  }

  if (grn.inventoryPosted) {
    throw new Error('GRN inventory has already been posted');
  }

  if (grn.items.length === 0) {
    throw new Error('GRN must contain at least one item');
  }

  for (const item of grn.items) {
    if (
      !Number.isInteger(item.acceptedQuantity) ||
      item.acceptedQuantity < 0
    ) {
      throw new Error('Invalid accepted quantity');
    }
  }

  const result = await stockService.postConfirmedGrn({
    pharmacyId: grn.pharmacyId,
    grnId: grn._id,
    idempotencyKey: `grn:${grn._id}:stock-in`,
    items: grn.items
  });

  if (!result.posted || result.grnId !== grn._id) {
    throw new Error('Stock posting was not confirmed');
  }

  return {
    ...grn,
    status: GRN_STATUS.CONFIRMED,
    inventoryPosted: true
  };
};

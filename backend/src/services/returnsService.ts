
export type ReturnType =
  | "CUSTOMER_RETURN"
  | "DISTRIBUTOR_RETURN";

export type ReturnDisposition =
  | "QUARANTINE"
  | "DAMAGED"
  | "RETURN_TO_SUPPLIER"
  | "RESTOCK_APPROVED";

export interface CreateReturnInput {
  pharmacyId: string;
  createdBy: string;
  returnType: ReturnType;
  reason: string;
  items: {
    medicineId: string;
    batchId?: string;
    saleItemAllocationId?: string;
    grnItemId?: string;
    quantity: number;
    reason?: string;
    disposition: ReturnDisposition;
  }[];
}

export const createReturnService = async (
  data: CreateReturnInput
) => {
  throw new Error("Create return not implemented yet");
};

export const getReturnsService = async (
  pharmacyId: string
) => {
  throw new Error("Get returns not implemented yet");
};

export const getReturnByIdService = async (
  returnId: string,
  pharmacyId: string
) => {
  throw new Error("Get return by ID not implemented yet");
};

export const confirmReturnService = async (
  returnId: string,
  pharmacyId: string
) => {
  throw new Error("Confirm return not implemented yet");
};

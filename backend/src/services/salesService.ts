
import mongoose from "mongoose";

// Data needed to create a sale
export interface CreateSaleInput {
  pharmacyId: string;
  createdBy: string;
  items: {
    medicineId: string;
    quantity: number;
  }[];
}

// Data needed for FIFO allocation
export interface SaleAllocation {
  batchId: string;
  quantity: number;
  unitPrice: number;
}

// Create a draft sale
export const createSaleService = async (
  data: CreateSaleInput
) => {
  throw new Error("Create sale not implemented yet");
};

// Get sales history
export const getSalesService = async (
  pharmacyId: string
) => {
  throw new Error("Get sales not implemented yet");
};

// Get a single sale
export const getSaleByIdService = async (
  saleId: string,
  pharmacyId: string
) => {
  throw new Error("Get sale by ID not implemented yet");
};

// Complete a sale
export const completeSaleService = async (
  saleId: string,
  pharmacyId: string
) => {
  throw new Error("Complete sale not implemented yet");
};

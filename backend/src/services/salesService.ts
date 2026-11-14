
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import Sale from "../models/Sale";
import SaleItem from "../models/SaleItem";

export interface CreateSaleInput {
  pharmacyId: string;
  createdBy: string;
  items: {
    medicineId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface SaleAllocation {
  batchId: string;
  quantity: number;
  unitPrice: number;
}

const toCents = (value: number): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    Math.round(value * 100) / 100 !== value
  ) {
    throw new Error("Invalid monetary amount");
  }

  return Math.round(value * 100);
};

const money = (cents: number) =>
  mongoose.Types.Decimal128.fromString(
    (cents / 100).toFixed(2)
  );

export const createSaleService = async (
  data: CreateSaleInput
) => {
  if (
    !mongoose.isValidObjectId(data.pharmacyId) ||
    !mongoose.isValidObjectId(data.createdBy)
  ) {
    throw new Error("Invalid pharmacy or user");
  }

  if (!Array.isArray(data.items) || !data.items.length) {
    throw new Error("At least one sale item is required");
  }

  let totalCents = 0;

  const items = data.items.map((item) => {
    if (!mongoose.isValidObjectId(item.medicineId)) {
      throw new Error("Invalid medicine ID");
    }

    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error("Quantity must be a positive integer");
    }

    const priceCents = toCents(item.unitPrice);

    if (priceCents <= 0) {
      throw new Error("Unit price must be greater than zero");
    }

    const subtotalCents = priceCents * item.quantity;

    if (!Number.isSafeInteger(subtotalCents)) {
      throw new Error("Sale amount is too large");
    }

    totalCents += subtotalCents;

    return {
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: money(priceCents),
      subtotal: money(subtotalCents)
    };
  });

  if (!Number.isSafeInteger(totalCents)) {
    throw new Error("Sale total is too large");
  }

  // TODO: Verify every medicine is ACTIVE and belongs to
  // this pharmacy's permitted catalog before production use.

  const session = await mongoose.startSession();

  try {
    let createdSale: unknown;

    await session.withTransaction(async () => {
      const [sale] = await Sale.create(
        [{
          pharmacyId: data.pharmacyId,
          createdBy: data.createdBy,
          saleNumber: `SALE-${randomUUID()}`,
          subtotal: money(totalCents),
          discountAmount: money(0),
          totalAmount: money(totalCents),
          status: "DRAFT"
        }],
        { session }
      );

      await SaleItem.insertMany(
        items.map((item) => ({
          ...item,
          pharmacyId: data.pharmacyId,
          saleId: sale._id
        })),
        { session }
      );

      createdSale = sale;
    });

    return createdSale;
  } finally {
    await session.endSession();
  }
};

export const getSalesService = async (
  pharmacyId: string
) => {
  return Sale.find({ pharmacyId })
    .sort({ createdAt: -1 })
    .lean();
};

export const getSaleByIdService = async (
  saleId: string,
  pharmacyId: string
) => {
  if (!mongoose.isValidObjectId(saleId)) {
    throw new Error("Invalid sale ID");
  }

  const sale = await Sale.findOne({
    _id: saleId,
    pharmacyId
  }).lean();

  if (!sale) return null;

  const items = await SaleItem.find({
    pharmacyId,
    saleId
  }).lean();

  return { ...sale, items };
};

// Day 9 task: stock deduction and FIFO integration.
export const completeSaleService = async (
  _saleId: string,
  _pharmacyId: string
) => {
  throw new Error(
    "Sale completion is not available on Day 6"
  );
};

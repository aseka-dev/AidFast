
import mongoose, { Schema } from "mongoose";

const saleItemAllocationSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true
    },
    saleItemId: {
      type: Schema.Types.ObjectId,
      ref: "SaleItem",
      required: true
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger
    },
    unitPrice: {
      type: Schema.Types.Decimal128,
      required: true
    }
  },
  {
    collection: "saleItemAllocations",
    timestamps: true
  }
);

saleItemAllocationSchema.index(
  { pharmacyId: 1, saleItemId: 1, batchId: 1 },
  { unique: true }
);

export default mongoose.model(
  "SaleItemAllocation",
  saleItemAllocationSchema
);

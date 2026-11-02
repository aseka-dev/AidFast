
import mongoose, { Schema, Document } from "mongoose";

export interface ISaleItemAllocation extends Document {
  saleItemId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  quantity: number;
}

const SaleItemAllocationSchema =
  new Schema<ISaleItemAllocation>(
    {
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
        validate: {
          validator: Number.isInteger,
          message: "Quantity must be a whole number"
        }
      }
    },
    {
      timestamps: true
    }
  );

// Prevent duplicate allocations for the same
// sale item and batch
SaleItemAllocationSchema.index(
  { saleItemId: 1, batchId: 1 },
  { unique: true }
);

// Index for finding allocations by batch
SaleItemAllocationSchema.index({ batchId: 1 });

const SaleItemAllocation =
  mongoose.model<ISaleItemAllocation>(
    "SaleItemAllocation",
    SaleItemAllocationSchema
  );

export default SaleItemAllocation;

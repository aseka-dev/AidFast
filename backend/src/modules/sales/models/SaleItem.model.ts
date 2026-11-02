
import mongoose, { Schema, Document } from "mongoose";

export interface ISaleItem extends Document {
  saleId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
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
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Validate subtotal before saving
SaleItemSchema.pre("validate", function () {
  const expectedSubtotal = this.quantity * this.unitPrice;

  if (
    Number.isFinite(expectedSubtotal) &&
    Math.abs(this.subtotal - expectedSubtotal) > 0.001
  ) {
    this.invalidate(
      "subtotal",
      "Subtotal must equal quantity multiplied by unit price"
    );
  }
});

// Index for faster sale item lookup
SaleItemSchema.index({ saleId: 1 });

const SaleItem = mongoose.model<ISaleItem>(
  "SaleItem",
  SaleItemSchema
);

export default SaleItem;


import mongoose, { Schema } from "mongoose";

const saleItemSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "MedicineCatalog",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger
    },
    unitPrice: {
      type: Schema.Types.Decimal128,
      required: true
    },
    subtotal: {
      type: Schema.Types.Decimal128,
      required: true
    }
  },
  { timestamps: true }
);

saleItemSchema.index({ pharmacyId: 1, saleId: 1 });

export default mongoose.model("SaleItem", saleItemSchema);

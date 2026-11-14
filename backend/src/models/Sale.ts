
import mongoose, { Schema } from "mongoose";

const saleSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true
    },
    saleNumber: {
      type: String,
      required: true
    },
    saleDate: {
      type: Date,
      default: Date.now
    },
    subtotal: {
      type: Schema.Types.Decimal128,
      required: true
    },
    discountAmount: {
      type: Schema.Types.Decimal128,
      default: 0
    },
    totalAmount: {
      type: Schema.Types.Decimal128,
      required: true
    },
    paymentMethod: {
      type: String,
      default: "NOT_SELECTED"
    },
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "VOIDED"],
      default: "DRAFT"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

saleSchema.index(
  { pharmacyId: 1, saleNumber: 1 },
  { unique: true }
);

export default mongoose.model("Sale", saleSchema);

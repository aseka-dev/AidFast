
import mongoose, { Schema } from "mongoose";
import { GRN_STATUS } from "../constants/GRNStatus";

const grnSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      default: null,
    },
    grnNumber: {
      type: String,
      required: true,
    },
    invoiceNumber: String,
    receivedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(GRN_STATUS),
      default: GRN_STATUS.DRAFT,
    },
    verificationComment: String,
    submittedAt: Date,
    verifiedAt: Date,
    confirmedAt: Date,
    reversedAt: Date,
    reversalReason: String,
    inventoryPosted: {
      type: Boolean,
      default: false,
    },
    totalAmount: Schema.Types.Decimal128,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, collection: "grns" }
);

grnSchema.index(
  { pharmacyId: 1, grnNumber: 1 },
  { unique: true }
);

export default mongoose.model("GRN", grnSchema);

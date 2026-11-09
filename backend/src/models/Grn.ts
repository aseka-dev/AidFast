import mongoose, { Schema, Document } from "mongoose";
import { GRN_STATUS, GRNStatus } from "../constants/grnStatus";

export interface IGRN extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  purchaseOrderId?: mongoose.Types.ObjectId;
  grnNumber: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  receivedDate: Date;
  status: GRNStatus;
  verificationComment?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  confirmedAt?: Date;
  reversedAt?: Date;
  reversalReason?: string;
  inventoryPosted: boolean;
  totalAmount?: mongoose.Types.Decimal128;
  createdBy?: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  confirmedBy?: mongoose.Types.ObjectId;
  reversedBy?: mongoose.Types.ObjectId;
}

const grnSchema = new Schema<IGRN>(
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
      trim: true,
    },
    invoiceNumber: String,
    invoiceDate: Date,
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
  {
    timestamps: true,
    collection: "grns",
  }
);

grnSchema.index(
  { pharmacyId: 1, grnNumber: 1 },
  { unique: true }
);

export default mongoose.model<IGRN>("GRN", grnSchema);

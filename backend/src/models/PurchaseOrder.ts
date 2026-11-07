import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrder extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  purchaseOrderNumber: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CANCELLED";
  totalAmount?: mongoose.Types.Decimal128;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
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
    purchaseOrderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    orderDate: {
      type: Date,
      required: true,
    },
    expectedDeliveryDate: Date,
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },
    totalAmount: Schema.Types.Decimal128,
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "purchaseOrders",
  }
);

purchaseOrderSchema.index(
  { pharmacyId: 1, purchaseOrderNumber: 1 },
  { unique: true }
);

export default mongoose.model<IPurchaseOrder>(
  "PurchaseOrder",
  purchaseOrderSchema
);

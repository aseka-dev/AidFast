import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrderItem extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  purchaseOrderId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  orderedQuantity: number;
  unitPurchasePrice: mongoose.Types.Decimal128;
  lineTotal?: mongoose.Types.Decimal128;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "MedicineCatalog",
      required: true,
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPurchasePrice: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    lineTotal: Schema.Types.Decimal128,
  },
  {
    timestamps: true,
    collection: "purchaseOrderItems",
  }
);

purchaseOrderItemSchema.index({
  pharmacyId: 1,
  purchaseOrderId: 1,
});

export default mongoose.model<IPurchaseOrderItem>(
  "PurchaseOrderItem",
  purchaseOrderItemSchema
);

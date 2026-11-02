
import mongoose, { Schema } from "mongoose";

const grnItemSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    grnId: {
      type: Schema.Types.ObjectId,
      ref: "GRN",
      required: true,
    },
    purchaseOrderItemId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrderItem",
      default: null,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "MedicineCatalog",
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    orderedQuantity: {
      type: Number,
      min: 0,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    damagedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejectedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejectionReason: String,
    unitOfMeasure: String,
    wholesalePrice: Schema.Types.Decimal128,
    retailPrice: Schema.Types.Decimal128,
    lineTotal: Schema.Types.Decimal128,
  },
  { timestamps: true, collection: "grnItems" }
);

// Rejected quantity includes damaged and returned units.
grnItemSchema.pre("validate", function () {
  const received = this.receivedQuantity ?? 0;
  const rejected = this.rejectedQuantity ?? 0;
  const damaged = this.damagedQuantity ?? 0;
  const returned = this.returnedQuantity ?? 0;

  if (damaged + returned > rejected) {
    this.invalidate(
      "rejectedQuantity",
      "Rejected quantity must include damaged and returned units."
    );
  }

  if (rejected > received) {
    this.invalidate(
      "rejectedQuantity",
      "Rejected quantity cannot exceed received quantity."
    );
  }

  this.acceptedQuantity = received - rejected;
});

grnItemSchema.index({ pharmacyId: 1, grnId: 1 });

export default mongoose.model("GRNItem", grnItemSchema);

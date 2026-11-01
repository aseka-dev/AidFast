
import mongoose, { Schema, Document } from "mongoose";

export interface IReturnItem extends Document {
  returnId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
  condition: "good" | "damaged" | "expired";
  restockable: boolean;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    returnId: {
      type: Schema.Types.ObjectId,
      ref: "Return",
      required: true
    },

    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
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
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    refundAmount: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500
    },

    condition: {
      type: String,
      enum: ["good", "damaged", "expired"],
      required: true
    },

    restockable: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Validate refund amount and stock condition
ReturnItemSchema.pre("validate", function () {
  const expectedRefund = this.quantity * this.unitPrice;

  if (
    Number.isFinite(expectedRefund) &&
    Math.abs(this.refundAmount - expectedRefund) > 0.001
  ) {
    this.invalidate(
      "refundAmount",
      "Refund amount must equal quantity multiplied by unit price"
    );
  }

  if (
    this.restockable &&
    this.condition !== "good"
  ) {
    this.invalidate(
      "restockable",
      "Damaged or expired medicines cannot be restocked"
    );
  }
});

// Indexes for faster lookup
ReturnItemSchema.index({ returnId: 1 });
ReturnItemSchema.index({ medicineId: 1 });
ReturnItemSchema.index({ batchId: 1 });

const ReturnItem = mongoose.model<IReturnItem>(
  "ReturnItem",
  ReturnItemSchema
);

export default ReturnItem;

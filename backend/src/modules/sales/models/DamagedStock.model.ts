
import mongoose, { Schema, Document } from "mongoose";

export interface IDamagedStock extends Document {
  medicineId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  quantity: number;
  reason: "damaged" | "expired" | "defective" | "other";
  description?: string;
  source: "inventory" | "customer_return" | "supplier_return";
  returnItemId?: mongoose.Types.ObjectId;
  status: "recorded" | "disposed" | "returned_to_supplier";
  recordedBy: mongoose.Types.ObjectId;
  recordedDate: Date;
  disposalDate?: Date;
}

const DamagedStockSchema = new Schema<IDamagedStock>(
  {
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

    reason: {
      type: String,
      enum: ["damaged", "expired", "defective", "other"],
      required: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    source: {
      type: String,
      enum: [
        "inventory",
        "customer_return",
        "supplier_return"
      ],
      required: true,
      default: "inventory"
    },

    returnItemId: {
      type: Schema.Types.ObjectId,
      ref: "ReturnItem"
    },

    status: {
      type: String,
      enum: [
        "recorded",
        "disposed",
        "returned_to_supplier"
      ],
      default: "recorded"
    },

    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recordedDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    disposalDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Custom validation
DamagedStockSchema.pre("validate", function () {

  // Returned stock must reference a return item
  if (
    this.source !== "inventory" &&
    !this.returnItemId
  ) {
    this.invalidate(
      "returnItemId",
      "Returned stock must reference a return item"
    );
  }

  // Inventory damage should not reference a return item
  if (
    this.source === "inventory" &&
    this.returnItemId
  ) {
    this.invalidate(
      "returnItemId",
      "Inventory damage cannot reference a return item"
    );
  }

  // Disposal date is required for disposed stock
  if (
    this.status === "disposed" &&
    !this.disposalDate
  ) {
    this.invalidate(
      "disposalDate",
      "Disposal date is required for disposed stock"
    );
  }

  // Disposal date cannot be before recorded date
  if (
    this.disposalDate &&
    this.recordedDate &&
    this.disposalDate < this.recordedDate
  ) {
    this.invalidate(
      "disposalDate",
      "Disposal date cannot be before recorded date"
    );
  }

});

// Indexes for faster searching
DamagedStockSchema.index({ medicineId: 1 });
DamagedStockSchema.index({ batchId: 1 });
DamagedStockSchema.index({ status: 1 });
DamagedStockSchema.index({ recordedDate: -1 });

const DamagedStock = mongoose.model<IDamagedStock>(
  "DamagedStock",
  DamagedStockSchema
);

export default DamagedStock;

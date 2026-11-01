
import mongoose, { Schema, Document } from "mongoose";

export interface IReturn extends Document {
  returnNumber: string;
  returnType: "customer" | "supplier";
  saleId?: mongoose.Types.ObjectId;
  purchaseId?: mongoose.Types.ObjectId;
  returnDate: Date;
  reason: string;
  totalRefund: number;
  status: "pending" | "approved" | "rejected";
  createdBy: mongoose.Types.ObjectId;
}

const ReturnSchema = new Schema<IReturn>(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    returnType: {
      type: String,
      enum: ["customer", "supplier"],
      required: true
    },

    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale"
    },

    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase"
    },

    returnDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500
    },

    totalRefund: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Validate transaction references
ReturnSchema.pre("validate", function () {
  if (this.returnType === "customer") {
    if (!this.saleId) {
      this.invalidate(
        "saleId",
        "Customer returns must reference a sale"
      );
    }

    if (this.purchaseId) {
      this.invalidate(
        "purchaseId",
        "Customer returns cannot reference a purchase"
      );
    }
  }

  if (this.returnType === "supplier") {
    if (!this.purchaseId) {
      this.invalidate(
        "purchaseId",
        "Supplier returns must reference a purchase"
      );
    }

    if (this.saleId) {
      this.invalidate(
        "saleId",
        "Supplier returns cannot reference a sale"
      );
    }
  }
});

// Indexes for faster lookup
ReturnSchema.index({ saleId: 1 });
ReturnSchema.index({ purchaseId: 1 });
ReturnSchema.index({ returnType: 1, status: 1 });

const Return = mongoose.model<IReturn>(
  "Return",
  ReturnSchema
);

export default Return;

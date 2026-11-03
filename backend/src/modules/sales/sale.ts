
import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  saleNumber: string;
  saleDate: Date;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paymentMethod: "cash" | "card" | "online";
  paymentStatus: "paid" | "pending";
  createdBy: mongoose.Types.ObjectId;
  status: "completed" | "cancelled";
}

const SaleSchema = new Schema<ISale>(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    saleDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0
    },

    netAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid"
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed"
    }
  },
  {
    timestamps: true
  }
);

SaleSchema.pre("validate", function () {
  if (this.discount > this.totalAmount) {
    this.invalidate(
      "discount",
      "Discount cannot exceed total amount"
    );
  }

  if (
    Math.abs(
      this.netAmount -
      (this.totalAmount - this.discount)
    ) > 0.001
  ) {
    this.invalidate(
      "netAmount",
      "Net amount must equal total minus discount"
    );
  }
});

const Sale = mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;

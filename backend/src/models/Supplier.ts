import mongoose, { Schema, Document } from "mongoose";

export interface ISupplier extends Document {
  pharmacyId: mongoose.Types.ObjectId;
  supplierName: string;
  contact?: string;
  email?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
}

const supplierSchema = new Schema<ISupplier>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    collection: "suppliers",
  }
);

supplierSchema.index({ pharmacyId: 1, supplierName: 1 });

export default mongoose.model<ISupplier>("Supplier", supplierSchema);

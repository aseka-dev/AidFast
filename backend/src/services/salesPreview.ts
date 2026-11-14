
import mongoose from "mongoose";
import Batch from "../models/Batch";
import MedicineCatalog from "../models/MedicineCatalog";
import PharmacyMedicine from "../models/PharmacyMedicine";
import { allocateFIFO } from "./fifoService";

export async function previewSaleAllocation(
  pharmacyId: string,
  medicineId: string,
  quantity: number
) {
  if (
    !mongoose.isValidObjectId(pharmacyId) ||
    !mongoose.isValidObjectId(medicineId) ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error("Invalid preview request");
  }

  const [medicine, link] = await Promise.all([
    MedicineCatalog.findOne({
      _id: medicineId,
      status: "ACTIVE"
    }).lean(),
    PharmacyMedicine.findOne({
      pharmacyId,
      medicineId,
      status: "ACTIVE"
    }).lean()
  ]);

  if (!medicine || !link) {
    throw new Error("Medicine not available in this pharmacy");
  }

  const batches = await Batch.find({
    pharmacyId,
    medicineId
  }).lean();

  const allocations = allocateFIFO(
    batches.map(batch => ({
      batchId: String(batch._id),
      receivedDate: batch.receivedDate,
      expiryDate: batch.expiryDate,
      quantityAvailable: batch.currentQuantity,
      unitPrice: Number(batch.retailPrice?.toString() ?? 0),
      status: batch.batchStatus === "ACTIVE"
        ? "AVAILABLE" as const
        : batch.batchStatus === "QUARANTINED"
          ? "QUARANTINED" as const
          : "BLOCKED" as const,
      safetyStatus: batch.safetyStatus
    })),
    quantity
  );

  return {
    medicineId,
    medicineName: medicine.medicineName,
    requestedQuantity: quantity,
    allocations,
    previewOnly: true,
    message: "Stock has not been reserved or deducted"
  };
}

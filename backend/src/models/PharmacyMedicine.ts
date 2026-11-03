import mongoose, { Schema } from 'mongoose';

const pharmacyMedicineSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'MedicineCatalog', required: true },
  minimumStockLevel: { type: Number, required: true, default: 0, min: 0, validate: Number.isSafeInteger },
  isPubliclyVisible: { type: Boolean, required: true, default: false },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true },
  publicDescription: { type: String, trim: true },
}, {
  collection: 'pharmacyMedicines',
  timestamps: true,
});

pharmacyMedicineSchema.index({ pharmacyId: 1, medicineId: 1 }, { unique: true });
export default mongoose.model('PharmacyMedicine', pharmacyMedicineSchema);

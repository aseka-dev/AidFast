import mongoose, { Schema } from 'mongoose';

// Derived public read model. No exact quantities, costs, or internal comments.
const publicAvailabilitySnapshotSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'MedicineCatalog', required: true },
  availabilityStatus: { type: String, enum: ['AVAILABLE', 'LOW_AVAILABILITY', 'OUT_OF_STOCK'], required: true },
  isPubliclyVisible: { type: Boolean, required: true, default: false },
  lastUpdatedAt: { type: Date, required: true, default: Date.now },
  sourceVersion: { type: Number, required: true, default: 0, min: 0, validate: Number.isSafeInteger },
}, { collection: 'publicAvailabilitySnapshots', timestamps: true });

publicAvailabilitySnapshotSchema.index({ pharmacyId: 1, medicineId: 1 }, { unique: true });
publicAvailabilitySnapshotSchema.index({ pharmacyId: 1, isPubliclyVisible: 1, availabilityStatus: 1 });

export default mongoose.model('PublicAvailabilitySnapshot', publicAvailabilitySnapshotSchema);

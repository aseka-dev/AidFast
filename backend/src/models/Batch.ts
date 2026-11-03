import mongoose, { Schema } from 'mongoose';

const batchSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'MedicineCatalog', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  grnItemId: { type: Schema.Types.ObjectId, ref: 'GRNItem', required: true },
  batchNumber: { type: String, required: true, trim: true },
  purchaseDate: { type: Date },
  receivedDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  currentQuantity: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  initialQuantity: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  unitOfMeasure: { type: String, required: true, trim: true },
  wholesalePrice: { type: Schema.Types.Decimal128 },
  retailPrice: { type: Schema.Types.Decimal128 },
  batchStatus: { type: String, enum: ['ACTIVE', 'BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'], default: 'ACTIVE' },
  safetyStatus: { type: String, enum: ['CLEAR', 'UNDER_REVIEW', 'MATCHED', 'RESOLVED'], default: 'CLEAR' },
}, {
  collection: 'batches',
  timestamps: true,
});

batchSchema.index({ pharmacyId: 1, grnItemId: 1 }, { unique: true });
batchSchema.index({ pharmacyId: 1, medicineId: 1, expiryDate: 1 });
batchSchema.index({ pharmacyId: 1, medicineId: 1, receivedDate: 1 });
batchSchema.index({ pharmacyId: 1, batchNumber: 1 }); // NOT unique

// Validate related GRNItem, supplier, pharmacy and medicine references in service layer.
// Never edit currentQuantity directly from controllers: only M2 stockPosting does so.
export default mongoose.model('Batch', batchSchema);

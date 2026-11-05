import mongoose, { Schema } from 'mongoose';
import type { MovementType } from '../contracts/stockPosting';

const movementTypes: MovementType[] = [
  'GRN_RECEIPT', 'SALE', 'CUSTOMER_RETURN', 'DISTRIBUTOR_RETURN',
  'DAMAGE', 'EXPIRY', 'ADJUSTMENT', 'REVERSAL'
];

// Immutable record of a posted inventory change. Do not use the model for draft events.
const stockMovementSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'MedicineCatalog', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  movementType: { type: String, enum: movementTypes, required: true },
  quantityDelta: { type: Number, required: true, validate: { validator: (n: number) => Number.isSafeInteger(n) && n !== 0, message: 'Quantity delta must be a non-zero safe integer' } },
  quantityBefore: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  quantityAfter: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  reason: { type: String, required: true, trim: true },
  referenceType: { type: String, required: true, trim: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  idempotencyKey: { type: String, required: true, trim: true },
  occurredAt: { type: Date, required: true, default: Date.now },
}, { collection: 'stockMovements', timestamps: true });

stockMovementSchema.pre('validate', function () {
  if (Number.isSafeInteger(this.quantityBefore) && Number.isSafeInteger(this.quantityDelta) &&
      this.quantityAfter !== this.quantityBefore + this.quantityDelta) {
    this.invalidate('quantityAfter', 'Quantity after must equal quantity before plus delta');
  }
});

// Guard against accidental edits via document.save(). Other update/delete methods
// must be prohibited by service-layer policy and DB role permissions.
stockMovementSchema.pre('save', function () {
  if (!this.isNew) throw new Error('Stock movements are immutable; record a reversal instead');
});

stockMovementSchema.index({ pharmacyId: 1, idempotencyKey: 1 }, { unique: true });
stockMovementSchema.index({ pharmacyId: 1, batchId: 1, occurredAt: -1 });
stockMovementSchema.index({ pharmacyId: 1, medicineId: 1, occurredAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);

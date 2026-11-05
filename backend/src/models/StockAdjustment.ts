import mongoose, { Schema } from 'mongoose';

const stockAdjustmentSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  adjustmentNumber: { type: String, required: true, trim: true },
  adjustmentType: { type: String, required: true, trim: true }, // e.g. STOCK_COUNT, DATA_CORRECTION
  quantityDelta: { type: Number, required: true, validate: { validator: (n: number) => Number.isSafeInteger(n) && n !== 0, message: 'Adjustment must be a non-zero safe integer' } },
  reason: { type: String, required: true, trim: true, minlength: 3 },
  approvalStatus: { type: String, enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'], required: true, default: 'DRAFT' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  postedMovementId: { type: Schema.Types.ObjectId, ref: 'StockMovement' },
  postedAt: { type: Date },
}, { collection: 'stockAdjustments', timestamps: true });

stockAdjustmentSchema.pre('validate', function () {
  if (this.approvalStatus === 'APPROVED' && (!this.approvedBy || !this.approvedAt)) {
    this.invalidate('approvalStatus', 'Approved adjustments require approver and approval date');
  }
  if (this.postedMovementId && this.approvalStatus !== 'APPROVED') {
    this.invalidate('postedMovementId', 'Only approved adjustments may be posted');
  }
});

stockAdjustmentSchema.index({ pharmacyId: 1, adjustmentNumber: 1 }, { unique: true });
stockAdjustmentSchema.index({ pharmacyId: 1, batchId: 1, createdAt: -1 });

// IMPORTANT: APPROVED means approved, not necessarily posted. Service must atomically
// create StockMovement once and set postedMovementId, using a stable idempotency key.
export default mongoose.model('StockAdjustment', stockAdjustmentSchema);

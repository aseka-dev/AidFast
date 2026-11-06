import mongoose, { Schema } from 'mongoose';

const medicineCatalogSchema = new Schema({
  medicineCode: { type: String, required: true, trim: true, unique: true },
  medicineName: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true }, 
  brandTradeName: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  manufacturer: { type: String, required: true, trim: true },
  strength: { type: String, trim: true },
  dosageForm: { type: String, trim: true },
  packSize: { type: String, required: true, trim: true },
  prescriptionRequired: { type: Boolean },
  description: { type: String, trim: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true },
}, {
  collection: 'medicineCatalog',
  timestamps: true,
});

medicineCatalogSchema.index({ genericName: 1, brandTradeName: 1 });

export default mongoose.model('MedicineCatalog', medicineCatalogSchema);

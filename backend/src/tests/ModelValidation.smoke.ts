import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import Batch from '../models/Batch';

async function main() {
  const pharmacyId = new mongoose.Types.ObjectId();
  const medicineId = new mongoose.Types.ObjectId();

  await new MedicineCatalog({
    medicineCode: 'MED-TEST-001',
    medicineName: 'Paracetamol Tablet 500 mg',
    genericName: 'Paracetamol',
    brandTradeName: 'Example Trade Name',
    category: 'Pharmaceutical Medicines',
    manufacturer: 'Example Manufacturer',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packSize: '100 tablets',
    prescriptionRequired: false,
  }).validate();

  await new PharmacyMedicine({
    pharmacyId,
    medicineId,
    minimumStockLevel: 20,
  }).validate();

  const validBatch = {
    pharmacyId,
    medicineId,
    supplierId: new mongoose.Types.ObjectId(),
    grnItemId: new mongoose.Types.ObjectId(),
    batchNumber: 'PAR-001',
    receivedDate: new Date('2026-11-01'),
    expiryDate: new Date('2028-01-01'),
    currentQuantity: 500,
    initialQuantity: 500,
    unitOfMeasure: 'tablet',
    wholesalePrice: '0.40',
    retailPrice: '0.60',
  };
  await new Batch(validBatch).validate();
  let rejectedInvalidQuantity = false;
  try { await new Batch({ ...validBatch, currentQuantity: -3 }).validate(); }
  catch { rejectedInvalidQuantity = true; }
  assert.equal(rejectedInvalidQuantity, true, 'Negative stock must fail validation');
  console.log('M2 model validation smoke test passed (no database required).');
}

main().catch(error => { console.error(error); process.exitCode = 1; });

/**
 * DRY RUN by default. To mutate a database: --apply plus explicit allow-list environment.
 * Do not run against the team's shared development database or production.
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import Pharmacy from '../models/Pharmacy';
import User from '../models/User';
import Supplier from '../models/supplier';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import GRN from '../models/grn';
import GRNItem from '../models/grnItem';
import Batch from '../models/Batch';
import StockMovement from '../models/StockMovement';
import PublicAvailabilitySnapshot from '../models/PublicAvailabilitySnapshot';
import { createPublicAvailabilityProjection, type EligibleStockLot } from '../services/eligibleStock';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEMO_PHARMACY_NAME = 'AidFast M2 QA Pharmacy';
const APPLY = process.argv.includes('--apply');

const fixtureMedicines = [
  { medicineCode: 'M2QA-MED-001', medicineName: 'Paracetamol Tablet 500 mg', genericName: 'Paracetamol',
    brandTradeName: 'M2 QA Example', category: 'Pharmaceutical Medicines', manufacturer: 'M2 Demo Manufacturer',
    strength: '500 mg', dosageForm: 'Tablet', packSize: '100 tablets', minimumStockLevel: 30, baseUnit: 'tablet' },
  { medicineCode: 'M2QA-MED-002', medicineName: 'Oral Rehydration Salts Sachets', genericName: 'Oral Rehydration Salts',
    brandTradeName: 'M2 QA ORS', category: 'Pharmaceutical Medicines', manufacturer: 'M2 Demo Manufacturer',
    strength: '1 sachet', dosageForm: 'Powder', packSize: '20 sachets', minimumStockLevel: 10, baseUnit: 'sachet' }
];

const receiptLots = [
  { medicineCode: 'M2QA-MED-001', batchNumber: 'M2QA-PAR-LOT1', receivedDate: '2026-09-01', expiryDate: '2027-04-30', quantity: 50, batchStatus: 'ACTIVE' as const },
  { medicineCode: 'M2QA-MED-001', batchNumber: 'M2QA-PAR-LOT2', receivedDate: '2026-10-01', expiryDate: '2028-09-01', quantity: 120, batchStatus: 'ACTIVE' as const },
  { medicineCode: 'M2QA-MED-001', batchNumber: 'M2QA-PAR-EXPIRED', receivedDate: '2025-08-01', expiryDate: '2026-09-01', quantity: 10, batchStatus: 'EXPIRED' as const },
  { medicineCode: 'M2QA-MED-001', batchNumber: 'M2QA-PAR-BLOCKED', receivedDate: '2026-08-01', expiryDate: '2028-09-01', quantity: 30, batchStatus: 'BLOCKED' as const },
  { medicineCode: 'M2QA-MED-002', batchNumber: 'M2QA-ORS-LOW', receivedDate: '2026-10-15', expiryDate: '2028-03-01', quantity: 6, batchStatus: 'ACTIVE' as const }
];

async function run(): Promise<void> {
  if (!APPLY) {
    console.log('DRY RUN: No database writes. M2 demo fixtures:', receiptLots.map(x => x.batchNumber));
    console.log('To apply ONLY to an isolated QA database: set MONGO_URI, M2_SEED_TARGET_DB and AIDFAST_ALLOW_M2_SEED=YES; then pass --apply.');
    return;
  }
  if (process.env.NODE_ENV === 'production' || process.env.AIDFAST_ALLOW_M2_SEED !== 'YES' || !process.env.M2_SEED_TARGET_DB) {
    throw new Error('Refusing seed: must be non-production with AIDFAST_ALLOW_M2_SEED=YES and M2_SEED_TARGET_DB configured');
  }
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is missing from backend/.env');

  await mongoose.connect(mongoUri);
  try {
    const actualDB = mongoose.connection.name;
    if (actualDB !== process.env.M2_SEED_TARGET_DB || !actualDB.toLowerCase().includes('m2')) {
      throw new Error(`Refusing seed: connected to ${actualDB}; allowed QA database must equal M2_SEED_TARGET_DB and include 'm2'`);
    }

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { name: DEMO_PHARMACY_NAME },
      { $setOnInsert: { name: DEMO_PHARMACY_NAME, address: 'Example QA-only location, Sri Lanka', status: 'ACTIVE' } },
      { upsert: true, new: true, runValidators: true }
    );
    const disabledUser = async (email: string, fullName: string) => User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, fullName, password: await bcrypt.hash(randomBytes(32).toString('hex'), 10), isActive: false } },
      { upsert: true, new: true, runValidators: true }
    );
    const preparedBy = await disabledUser('m2qa-preparer@example.invalid', 'M2 QA Preparer (Disabled)');
    const verifiedBy = await disabledUser('m2qa-verifier@example.invalid', 'M2 QA Verifier (Disabled)');
    if (String(preparedBy._id) === String(verifiedBy._id)) throw new Error('Distinct verifier required');

    const supplier = await Supplier.findOneAndUpdate(
      { pharmacyId: pharmacy._id, supplierName: 'M2 QA Distributor' },
      { $setOnInsert: { pharmacyId: pharmacy._id, supplierName: 'M2 QA Distributor', status: 'ACTIVE' } },
      { upsert: true, new: true, runValidators: true }
    );

    const meds = new Map<string, { id: mongoose.Types.ObjectId; unit: string }>();
    for (const fixture of fixtureMedicines) {
      const { minimumStockLevel, baseUnit, ...catalogFields } = fixture;
      const med = await MedicineCatalog.findOneAndUpdate(
        { medicineCode: catalogFields.medicineCode },
        { $setOnInsert: { ...catalogFields, status: 'ACTIVE' } },
        { upsert: true, new: true, runValidators: true }
      );
      await PharmacyMedicine.findOneAndUpdate(
        { pharmacyId: pharmacy._id, medicineId: med._id },
        { $setOnInsert: { pharmacyId: pharmacy._id, medicineId: med._id, minimumStockLevel, isPubliclyVisible: true, status: 'ACTIVE' } },
        { upsert: true, new: true, runValidators: true }
      );
      meds.set(fixture.medicineCode, { id: med._id as mongoose.Types.ObjectId, unit: baseUnit });
    }

    for (let i = 0; i < receiptLots.length; i++) {
      const lot = receiptLots[i];
      const medicine = meds.get(lot.medicineCode);
      if (!medicine) throw new Error('Unknown fixture medicine');
      const num = `M2QA-GRN-${String(i + 1).padStart(3, '0')}`;
      const source = await GRN.findOneAndUpdate(
        { pharmacyId: pharmacy._id, grnNumber: num },
        { $setOnInsert: {
          pharmacyId: pharmacy._id, supplierId: supplier._id, grnNumber: num, invoiceNumber: `M2QA-INV-${i + 1}`,
          receivedDate: new Date(`${lot.receivedDate}T00:00:00.000Z`), status: 'CONFIRMED', inventoryPosted: true,
          createdBy: preparedBy._id, submittedBy: preparedBy._id, verifiedBy: verifiedBy._id,
          confirmedBy: verifiedBy._id, verifiedAt: new Date(), confirmedAt: new Date()
        } },
        { upsert: true, new: true, runValidators: true }
      );
      const item = await GRNItem.findOneAndUpdate(
        { pharmacyId: pharmacy._id, grnId: source._id, batchNumber: lot.batchNumber },
        { $setOnInsert: {
          pharmacyId: pharmacy._id, grnId: source._id, medicineId: medicine.id,
          batchNumber: lot.batchNumber, expiryDate: new Date(`${lot.expiryDate}T00:00:00.000Z`),
          receivedQuantity: lot.quantity, acceptedQuantity: lot.quantity, rejectedQuantity: 0,
          unitOfMeasure: medicine.unit, wholesalePrice: mongoose.Types.Decimal128.fromString('1.00')
        } },
        { upsert: true, new: true, runValidators: true }
      );
      const batch = await Batch.findOneAndUpdate(
        { pharmacyId: pharmacy._id, grnItemId: item._id },
        { $setOnInsert: {
          pharmacyId: pharmacy._id, medicineId: medicine.id, supplierId: supplier._id,
          grnItemId: item._id, batchNumber: lot.batchNumber,
          receivedDate: new Date(`${lot.receivedDate}T00:00:00.000Z`),
          expiryDate: new Date(`${lot.expiryDate}T00:00:00.000Z`),
          initialQuantity: lot.quantity, currentQuantity: lot.quantity,
          unitOfMeasure: medicine.unit, wholesalePrice: mongoose.Types.Decimal128.fromString('1.00'),
          retailPrice: mongoose.Types.Decimal128.fromString('1.50'), batchStatus: lot.batchStatus,
          safetyStatus: 'CLEAR'
        } },
        { upsert: true, new: true, runValidators: true }
      );
      if (!item.batchId) await GRNItem.updateOne({ _id: item._id }, { $set: { batchId: batch._id } });
      await StockMovement.findOneAndUpdate(
        { pharmacyId: pharmacy._id, idempotencyKey: `m2qa:${num}:receipt` },
        { $setOnInsert: {
          pharmacyId: pharmacy._id, medicineId: medicine.id, batchId: batch._id,
          performedBy: verifiedBy._id, movementType: 'GRN_RECEIPT', quantityDelta: lot.quantity,
          quantityBefore: 0, quantityAfter: lot.quantity, reason: 'M2 QA demo seed fixture',
          referenceType: 'GRNItem', referenceId: item._id, idempotencyKey: `m2qa:${num}:receipt`,
          occurredAt: new Date(`${lot.receivedDate}T00:00:00.000Z`)
        } },
        { upsert: true, new: true, runValidators: true }
      );
    }

    // Publish only availability status, not the exact quantity.
    for (const [, med] of meds) {
      const batches = await Batch.find({ pharmacyId: pharmacy._id, medicineId: med.id }).lean();
      const lots: EligibleStockLot[] = batches.map(b => ({
        pharmacyId: String(b.pharmacyId), medicineId: String(b.medicineId),
        currentQuantity: b.currentQuantity, batchStatus: b.batchStatus, safetyStatus: b.safetyStatus,
        expiryDate: b.expiryDate
      }));
      const now = new Date();
      const projection = createPublicAvailabilityProjection(lots, String(pharmacy._id), String(med.id), 10, true, now);
      await PublicAvailabilitySnapshot.findOneAndUpdate(
        { pharmacyId: pharmacy._id, medicineId: med.id },
        { $set: { ...projection, sourceVersion: 1 } },
        { upsert: true, new: true, runValidators: true }
      );
    }
    console.log(`Seeded/verified ${receiptLots.length} M2 QA batches for ${DEMO_PHARMACY_NAME} in database ${actualDB}.`);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(err => { console.error(err); process.exitCode = 1; });

import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Batch from '../models/Batch';
import requirePermission from '../middleware/permissionMiddleware';
import { PERMISSIONS } from '../config/permissions';
import auditLogger from '../utils/auditLogger';
import type { AuthRequest } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });
const pid = (req: { params: Record<string, unknown> }) => String(req.params.pharmacyId);
const queryString = (v: unknown) => typeof v === 'string' ? v.trim().slice(0, 120) : '';
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const priceSchema = z.object({ retailPrice: z.string().regex(/^\d+(?:\.\d{1,2})?$/) }).strict();

router.get('/', requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
  try {
    const medicineId = queryString(req.query.medicineId);
    if (medicineId && !mongoose.isValidObjectId(medicineId)) {
      res.status(400).json({ success: false, message: 'Invalid medicine ID' }); return;
    }
    const page = Math.max(1, Number.parseInt(queryString(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(queryString(req.query.limit), 10) || 10));
    const batchNumber = queryString(req.query.batchNumber);
    const filter: mongoose.QueryFilter<any> = { pharmacyId: pid(req) };
    if (medicineId) filter.medicineId = medicineId;
    if (batchNumber) filter.batchNumber = new RegExp(escapeRegex(batchNumber), 'i');
    const [data, total] = await Promise.all([
      Batch.find(filter).populate('medicineId', 'medicineName brandTradeName packSize')
        .populate('supplierId', 'supplierName').sort({ expiryDate: 1, _id: 1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      Batch.countDocuments(filter)
    ]);
    res.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) { console.error('Batch list error', error); res.status(500).json({ success: false, message: 'Batch lookup failed' }); }
});

router.get('/:batchId', requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
  try {
    const batchId = String(req.params.batchId);
    if (!mongoose.isValidObjectId(batchId)) {
      res.status(400).json({ success: false, message: 'Invalid batch ID' }); return;
    }
    const batch = await Batch.findOne({ _id: batchId, pharmacyId: pid(req) })
      .populate('medicineId', 'medicineName brandTradeName category packSize')
      .populate('supplierId', 'supplierName')
      .populate('grnItemId', 'grnId batchNumber acceptedQuantity').lean();
    if (!batch) { res.status(404).json({ success: false, message: 'Batch not found' }); return; }
    res.json({ success: true, data: batch });
  } catch (error) { console.error('Batch detail error', error); res.status(500).json({ success: false, message: 'Batch lookup failed' }); }
});

// IMPORTANT: direct batch creation would bypass the mandatory second-person GRN
// confirmation and immutable stock ledger. This endpoint intentionally rejects direct requests.
router.post('/', requirePermission(PERMISSIONS.INVENTORY_ADJUST), (_req, res) => {
  res.status(409).json({ success: false,
    message: 'Batch creation must occur through an independently confirmed GRN and central stock posting service.' });
});

router.patch('/:batchId', requirePermission(PERMISSIONS.CATALOG_UPDATE), async (req, res) => {
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false,
      message: 'Only retailPrice may be changed directly; submit a decimal string such as "12.50".',
      errors: parsed.error.flatten() }); return;
  }
  try {
    const batchId = String(req.params.batchId);
    if (!mongoose.isValidObjectId(batchId)) {
      res.status(400).json({ success: false, message: 'Invalid batch ID' }); return;
    }
    const previous = await Batch.findOne({ _id: batchId, pharmacyId: pid(req) });
    if (!previous) { res.status(404).json({ success: false, message: 'Batch not found' }); return; }
    const oldPrice = previous.retailPrice?.toString() || '(unset)';
    const updated = await Batch.findOneAndUpdate(
      { _id: batchId, pharmacyId: pid(req) },
      { $set: { retailPrice: mongoose.Types.Decimal128.fromString(parsed.data.retailPrice) } },
      { new: true, runValidators: true });
    if (!updated) { res.status(404).json({ success: false, message: 'Batch not found' }); return; }
    await auditLogger({
      pharmacyId: pid(req), userId: (req as AuthRequest).user?.userId,
      entity: 'Batch', entityId: batchId, action: 'BATCH_RETAIL_PRICE_UPDATED',
      description: `Batch retail price changed from ${oldPrice} to ${parsed.data.retailPrice}`,
      ipAddress: req.ip
    });
    res.json({ success: true, data: updated });
  } catch (error) { console.error('Batch update error', error); res.status(500).json({ success: false, message: 'Batch update failed' }); }
});

router.delete('/:batchId', requirePermission(PERMISSIONS.INVENTORY_ADJUST), (_req, res) => {
  res.status(409).json({ success: false,
    message: 'Historical stock batches cannot be deleted; use an audited adjustment or GRN reversal.' });
});

export default router;

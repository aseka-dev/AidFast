import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import PublicAvailabilitySnapshot from '../models/PublicAvailabilitySnapshot';
import requirePermission from '../middleware/permissionMiddleware';
import { PERMISSIONS } from '../config/permissions';

// Mounted with authenticate + requireSelectedPharmacy + matchPharmacyParam in server.ts.
const router = Router({ mergeParams: true });

const CATEGORIES = [
  'Pharmaceutical Medicines', 'Medical & Surgical Supplies',
  'Medical Devices & Diagnostics', 'Ayurvedic & Traditional Products',
  'Cosmetics & Personal Care', 'Vitamins, Minerals & Supplements',
  'Mother & Baby Care', 'Oral & Dental Care', 'Hygiene & Sanitation',
  'Family Planning & Sexual Health', 'Veterinary Medicines & Animal Care'
] as const;

const text = z.string().trim().max(180);
const createSchema = z.object({
  medicineCode: z.string().trim().min(1).max(60).optional(),
  productName: text.optional(),
  genericName: text.optional(),
  brandTradeName: text.optional(),
  dosageForm: text.optional(),
  strength: text.optional(),
  packSize: z.string().trim().min(1).max(120),
  manufacturer: z.string().trim().min(1).max(180),
  category: z.enum(CATEGORIES),
  minimumStockLevel: z.number().int().nonnegative().default(0)
}).strict().superRefine((value, ctx) => {
  if (value.category === 'Pharmaceutical Medicines') {
    for (const field of ['genericName', 'dosageForm', 'strength'] as const) {
      if (!value[field]?.trim()) ctx.addIssue({ code: 'custom', path: [field], message: `${field} is required` });
    }
  } else if (!value.productName?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['productName'], message: 'Product name is required' });
  }
});

const patchSchema = z.object({
  productName: text.optional(), genericName: text.optional(), brandTradeName: text.optional(),
  dosageForm: text.optional(), strength: text.optional(),
  packSize: z.string().trim().min(1).max(120).optional(),
  manufacturer: z.string().trim().min(1).max(180).optional(),
  category: z.enum(CATEGORIES).optional(),
  minimumStockLevel: z.number().int().nonnegative().optional()
}).strict();
const visibilitySchema = z.object({ isPubliclyVisible: z.boolean() }).strict();
const optInSchema = z.object({
  medicineId: z.string().refine(mongoose.isValidObjectId, 'Invalid medicine ID'),
  minimumStockLevel: z.number().int().nonnegative().default(0),
}).strict();

function pharmacyId(req: Request): string { return String(req.params.pharmacyId); }
function validId(id: string): boolean { return mongoose.isValidObjectId(id); }
function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function queryString(value: unknown): string { return typeof value === 'string' ? value.trim().slice(0, 120) : ''; }
function paging(req: Request) {
  const page = Math.max(1, Math.min(100000, Number.parseInt(queryString(req.query.page), 10) || 1));
  const limit = Math.max(1, Math.min(50, Number.parseInt(queryString(req.query.limit), 10) || 10));
  return { page, limit };
}
function failed(res: Response, error: unknown): void {
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate medicine code or pharmacy medicine link' });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  console.error('Medicine API error:', error);
  res.status(500).json({ success: false, message: 'Medicine request failed' });
}

// The two static paths MUST be registered before /:medicineId.
router.get('/catalog/search', requirePermission(PERMISSIONS.CATALOG_READ), async (req, res) => {
  try {
    const q = queryString(req.query.q);
    if (q.length < 2) { res.status(400).json({ success: false, message: 'Enter at least two characters' }); return; }
    const re = new RegExp(escapeRegex(q), 'i');
    const data = await MedicineCatalog.find({
      status: 'ACTIVE', $or: [{ medicineName: re }, { genericName: re }, { brandTradeName: re }]
    }).sort({ medicineName: 1 }).limit(20).lean();
    res.json({ success: true, data });
  } catch (error) { failed(res, error); }
});

router.post('/opt-in', requirePermission(PERMISSIONS.CATALOG_CREATE), async (req, res) => {
  const parsed = optInSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  try {
    const { medicineId, minimumStockLevel } = parsed.data;
    const product = await MedicineCatalog.findOne({ _id: medicineId, status: 'ACTIVE' });
    if (!product) { res.status(404).json({ success: false, message: 'Catalog product not found' }); return; }
    const existing = await PharmacyMedicine.findOne({ pharmacyId: pharmacyId(req), medicineId });
    if (existing?.status === 'ACTIVE') {
      res.status(409).json({ success: false, message: 'Already in this pharmacy catalog' }); return;
    }
    const link = existing
      ? await PharmacyMedicine.findByIdAndUpdate(existing._id,
          { status: 'ACTIVE', minimumStockLevel, isPubliclyVisible: false }, { new: true, runValidators: true })
      : await PharmacyMedicine.create({ pharmacyId: pharmacyId(req), medicineId,
          minimumStockLevel, isPubliclyVisible: false });
    res.status(201).json({ success: true, data: link, message: 'Added to pharmacy. Public visibility defaults to off.' });
  } catch (error) { failed(res, error); }
});

router.get('/', requirePermission(PERMISSIONS.CATALOG_READ), async (req, res) => {
  try {
    const { page, limit } = paging(req);
    const links = await PharmacyMedicine.find({ pharmacyId: pharmacyId(req), status: 'ACTIVE' })
      .select('medicineId minimumStockLevel isPubliclyVisible').lean();
    const ids = links.map(link => link.medicineId);
    const q = queryString(req.query.q);
    const category = queryString(req.query.category);
    const manufacturer = queryString(req.query.manufacturer);
    const filter: mongoose.QueryFilter<any> = { _id: { $in: ids }, status: 'ACTIVE' };
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ medicineName: re }, { genericName: re }, { brandTradeName: re }];
    }
    if (category) filter.category = category;
    if (manufacturer) filter.manufacturer = new RegExp(escapeRegex(manufacturer), 'i');
    const [records, total] = await Promise.all([
      MedicineCatalog.find(filter).sort({ medicineName: 1, _id: 1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      MedicineCatalog.countDocuments(filter)
    ]);
    const linkMap = new Map(links.map(link => [String(link.medicineId), link]));
    const data = records.map(record => ({ ...record, pharmacySettings: linkMap.get(String(record._id)) }));
    res.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) { failed(res, error); }
});

router.get('/:medicineId', requirePermission(PERMISSIONS.CATALOG_READ), async (req, res) => {
  try {
    const medicineId = String(req.params.medicineId);
    if (!validId(medicineId)) { res.status(400).json({ success: false, message: 'Invalid medicine ID' }); return; }
    const link = await PharmacyMedicine.findOne({ pharmacyId: pharmacyId(req), medicineId, status: 'ACTIVE' }).lean();
    if (!link) { res.status(404).json({ success: false, message: 'Medicine not found in this pharmacy' }); return; }
    const record = await MedicineCatalog.findOne({ _id: medicineId, status: 'ACTIVE' }).lean();
    if (!record) { res.status(404).json({ success: false, message: 'Catalog product not found' }); return; }
    res.json({ success: true, data: { ...record, pharmacySettings: link } });
  } catch (error) { failed(res, error); }
});

router.post('/', requirePermission(PERMISSIONS.CATALOG_CREATE), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  try {
    const v = parsed.data;
    const medicineName = v.category === 'Pharmaceutical Medicines'
      ? [v.genericName, v.dosageForm, v.strength].filter(Boolean).join(' ')
      : v.productName!;
    // Reuse shared master records through opt-in; don't silently create duplicates.
    const same = await MedicineCatalog.findOne({
      status: 'ACTIVE', medicineName: new RegExp(`^${escapeRegex(medicineName)}$`, 'i'),
      brandTradeName: new RegExp(`^${escapeRegex(v.brandTradeName || '')}$`, 'i'),
      manufacturer: new RegExp(`^${escapeRegex(v.manufacturer)}$`, 'i'),
      packSize: new RegExp(`^${escapeRegex(v.packSize)}$`, 'i')
    });
    if (same) { res.status(409).json({ success: false, message: 'Product already exists. Use catalog opt-in.', medicineId: same._id }); return; }
    const record = await MedicineCatalog.create({
      medicineCode: v.medicineCode || `MED-${randomUUID().slice(0, 12).toUpperCase()}`,
      medicineName, genericName: v.genericName || '', brandTradeName: v.brandTradeName || '',
      category: v.category, manufacturer: v.manufacturer, strength: v.strength || '',
      dosageForm: v.dosageForm || '', packSize: v.packSize, status: 'ACTIVE'
    });
    try {
      const link = await PharmacyMedicine.create({ pharmacyId: pharmacyId(req),
        medicineId: record._id, minimumStockLevel: v.minimumStockLevel, isPubliclyVisible: false });
      res.status(201).json({ success: true, data: { ...record.toObject(), pharmacySettings: link } });
    } catch (linkError) {
      // Compensate for a partially completed create; the catalog was created by this request.
      await MedicineCatalog.deleteOne({ _id: record._id });
      throw linkError;
    }
  } catch (error) { failed(res, error); }
});

router.patch('/:medicineId/visibility', requirePermission(PERMISSIONS.CATALOG_UPDATE), async (req, res) => {
  const parsed = visibilitySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten() }); return; }
  try {
    const medicineId = String(req.params.medicineId);
    if (!validId(medicineId)) { res.status(400).json({ success: false, message: 'Invalid medicine ID' }); return; }
    const link = await PharmacyMedicine.findOneAndUpdate(
      { pharmacyId: pharmacyId(req), medicineId, status: 'ACTIVE' },
      { $set: { isPubliclyVisible: parsed.data.isPubliclyVisible } }, { new: true, runValidators: true });
    if (!link) { res.status(404).json({ success: false, message: 'Medicine not found in pharmacy' }); return; }
    await PublicAvailabilitySnapshot.updateOne(
      { pharmacyId: pharmacyId(req), medicineId },
      { $set: { isPubliclyVisible: parsed.data.isPubliclyVisible } }
    ); // Does not create an availability status; Member 6 maintains the snapshot.
    res.json({ success: true, data: link });
  } catch (error) { failed(res, error); }
});

router.patch('/:medicineId', requirePermission(PERMISSIONS.CATALOG_UPDATE), async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data ?? {}).length) {
    res.status(400).json({ success: false, message: 'Provide valid fields only',
      errors: parsed.success ? undefined : parsed.error.flatten() }); return;
  }
  try {
    const medicineId = String(req.params.medicineId);
    if (!validId(medicineId)) { res.status(400).json({ success: false, message: 'Invalid medicine ID' }); return; }
    const link = await PharmacyMedicine.findOne({ pharmacyId: pharmacyId(req), medicineId, status: 'ACTIVE' });
    if (!link) { res.status(404).json({ success: false, message: 'Medicine not found in pharmacy' }); return; }
    const { minimumStockLevel, ...patch } = parsed.data;
    if (Object.keys(patch).length) {
      // Global master edits affect every linked pharmacy. Reject when shared.
      const others = await PharmacyMedicine.exists({ medicineId, pharmacyId: { $ne: pharmacyId(req) } });
      if (others) { res.status(409).json({ success: false,
        message: 'Shared catalog product: ask platform owner to edit global product details' }); return; }
      const current = await MedicineCatalog.findById(medicineId);
      if (!current) { res.status(404).json({ success: false, message: 'Catalog product not found' }); return; }
      const combined = { ...current.toObject(), ...patch };
      const category = String(combined.category);
      const name = category === 'Pharmaceutical Medicines'
        ? [combined.genericName, combined.dosageForm, combined.strength].filter(Boolean).join(' ').trim()
        : String(combined.medicineName);
      if (category === 'Pharmaceutical Medicines' &&
          (!combined.genericName || !combined.dosageForm || !combined.strength)) {
        res.status(400).json({ success: false, message: 'Generic name, dosage form, strength required' }); return;
      }
      if (!name) { res.status(400).json({ success: false, message: 'Medicine/product name required' }); return; }
      await MedicineCatalog.updateOne({ _id: medicineId }, { $set: {
        ...patch, medicineName: category === 'Pharmaceutical Medicines' ? name : (patch.productName || current.medicineName)
      } }, { runValidators: true });
    }
    if (minimumStockLevel !== undefined) {
      link.minimumStockLevel = minimumStockLevel;
      await link.save();
    }
    res.json({ success: true, data: await MedicineCatalog.findById(medicineId), pharmacySettings: link });
  } catch (error) { failed(res, error); }
});

router.delete('/:medicineId', requirePermission(PERMISSIONS.CATALOG_UPDATE), async (req, res) => {
  try {
    const medicineId = String(req.params.medicineId);
    if (!validId(medicineId)) { res.status(400).json({ success: false, message: 'Invalid medicine ID' }); return; }
    const link = await PharmacyMedicine.findOneAndUpdate(
      { pharmacyId: pharmacyId(req), medicineId, status: 'ACTIVE' },
      { $set: { status: 'INACTIVE', isPubliclyVisible: false } }, { new: true });
    if (!link) { res.status(404).json({ success: false, message: 'Medicine not found in pharmacy' }); return; }
    await PublicAvailabilitySnapshot.updateOne({ pharmacyId: pharmacyId(req), medicineId },
      { $set: { isPubliclyVisible: false } });
    res.json({ success: true, message: 'Medicine archived for this pharmacy; history preserved' });
  } catch (error) { failed(res, error); }
});

export default router;
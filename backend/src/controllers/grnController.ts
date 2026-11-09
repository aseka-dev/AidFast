import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import { canChangeGRNStatus, GRN_STATUS } from '../constants/grnStatus';
import GRN from '../models/Grn';
import GRNItem from '../models/GrnItem';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseOrderItem from '../models/PurchaseOrderItem';
import Supplier from '../models/Supplier';
import { grnInput, grnListQuery, GrnInput } from '../services/grnValidation';
import { addDecimals, equalDecimals, multiplyDecimal } from '../services/purchasingValidation';

class GrnRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function handler(action: (req: AuthRequest, res: Response) => Promise<void>) {
  return async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await action(req, res);
    } catch (error) {
      if (error instanceof GrnRequestError) {
        res.status(error.status).json({ success: false, message: error.message });
      } else if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '),
        });
      } else if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
        res.status(400).json({ success: false, message: error.message });
      } else if ((error as { code?: number })?.code === 11000) {
        res.status(409).json({ success: false, message: 'GRN number already exists for this pharmacy' });
      } else if ((error as { code?: number })?.code === 20) {
        res.status(503).json({
          success: false,
          message: 'GRN changes require MongoDB transaction support (replica set or mongos)',
        });
      } else {
        console.error('GRN request failed', error);
        res.status(500).json({ success: false, message: 'Unable to complete GRN request' });
      }
    }
  };
}

const getPharmacyId = (req: AuthRequest) => new mongoose.Types.ObjectId(req.user!.pharmacyId!);
const grnFilter = (req: AuthRequest) => {
  const id = req.params.id;
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    throw new GrnRequestError(400, 'Invalid GRN ID');
  }
  return { _id: new mongoose.Types.ObjectId(id), pharmacyId: getPharmacyId(req) };
};

function makeGrnNumber(date: Date): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `GRN-${day}-${randomBytes(8).toString('hex').toUpperCase()}`;
}

async function validateReferences(
  input: GrnInput,
  pharmacyId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession
): Promise<void> {
  const supplier = await Supplier.findOne({
    _id: input.supplierId,
    pharmacyId,
    status: 'ACTIVE',
  }).session(session);
  if (!supplier) throw new GrnRequestError(400, 'Supplier does not belong to this pharmacy or is inactive');

  const medicineIds = [...new Set(input.items.map(item => item.medicineId))];
  const [catalogCount, linkedCount] = await Promise.all([
    MedicineCatalog.countDocuments({ _id: { $in: medicineIds }, status: 'ACTIVE' }).session(session),
    PharmacyMedicine.countDocuments({
      pharmacyId,
      medicineId: { $in: medicineIds },
      status: 'ACTIVE',
    }).session(session),
  ]);
  if (catalogCount !== medicineIds.length || linkedCount !== medicineIds.length) {
    throw new GrnRequestError(400, 'Each medicine must be active in the catalog and linked to this pharmacy');
  }

  if (!input.purchaseOrderId) {
    if (input.items.some(item => item.purchaseOrderItemId)) {
      throw new GrnRequestError(400, 'Purchase order item references require a purchase order');
    }
    return;
  }

  const order = await PurchaseOrder.findOne({
    _id: input.purchaseOrderId,
    pharmacyId,
    supplierId: input.supplierId,
    status: { $ne: 'CANCELLED' },
  }).session(session);
  if (!order) throw new GrnRequestError(400, 'Purchase order does not belong to this pharmacy and supplier or is cancelled');

  const orderItems = await PurchaseOrderItem.find({
    pharmacyId,
    purchaseOrderId: input.purchaseOrderId,
  }).session(session);
  if (orderItems.length === 0) throw new GrnRequestError(400, 'Purchase order has no items');
  for (const item of input.items) {
    const matchesOrder = orderItems.some(orderItem =>
      String(orderItem.medicineId) === item.medicineId &&
      (!item.purchaseOrderItemId || String(orderItem._id) === item.purchaseOrderItemId)
    );
    if (!matchesOrder) {
      throw new GrnRequestError(400, 'GRN items must match the selected purchase order');
    }
  }
}

function normalizeFinancials(input: GrnInput): GrnInput {
  const items = input.items.map(item => {
    const calculatedLineTotal = item.wholesalePrice === undefined
      ? item.lineTotal
      : multiplyDecimal(item.wholesalePrice, item.receivedQuantity - item.rejectedQuantity);
    if (
      calculatedLineTotal !== undefined &&
      item.lineTotal !== undefined &&
      item.wholesalePrice !== undefined &&
      !equalDecimals(item.lineTotal, calculatedLineTotal)
    ) {
      throw new GrnRequestError(400, 'Item lineTotal does not match accepted quantity and wholesale price');
    }
    return { ...item, lineTotal: calculatedLineTotal };
  });
  const totalAmount = addDecimals(items.map(item => item.lineTotal ?? '0'));
  if (input.totalAmount !== undefined && !equalDecimals(input.totalAmount, totalAmount)) {
    throw new GrnRequestError(400, 'totalAmount does not match GRN items');
  }
  return { ...input, items, totalAmount };
}

function itemDocumentData(item: GrnInput['items'][number]) {
  return {
    ...item,
    acceptedQuantity: item.receivedQuantity - item.rejectedQuantity,
  };
}

async function loadGrnItems(
  grnId: mongoose.Types.ObjectId,
  pharmacyId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const query = GRNItem.find({ grnId, pharmacyId }).sort({ createdAt: 1, _id: 1 });
  if (session) query.session(session);
  return query;
}

export const listGrns = handler(async (req, res) => {
  const { status } = grnListQuery.parse(req.query);
  const filter: Record<string, unknown> = { pharmacyId: getPharmacyId(req) };
  if (status) filter.status = status;
  const grns = await GRN.find(filter).sort({ receivedDate: -1, _id: -1 });
  const data = await Promise.all(grns.map(async grn => ({
    ...grn.toObject(),
    items: await loadGrnItems(grn._id, getPharmacyId(req)),
  })));
  res.json({ success: true, data });
});

export const getGrn = handler(async (req, res) => {
  const id = grnFilter(req);
  const grn = await GRN.findOne(id);
  if (!grn) throw new GrnRequestError(404, 'GRN not found');
  res.json({
    success: true,
    data: { ...grn.toObject(), items: await loadGrnItems(grn._id, getPharmacyId(req)) },
  });
});

export const createGrn = handler(async (req, res) => {
  const input = normalizeFinancials(grnInput.parse(req.body));
  const pharmacyId = getPharmacyId(req);
  const session = await mongoose.startSession();
  let result: Record<string, unknown> | undefined;
  try {
    await session.withTransaction(async () => {
      await validateReferences(input, pharmacyId, session);
      const grn = new GRN({
        pharmacyId,
        supplierId: input.supplierId,
        purchaseOrderId: input.purchaseOrderId,
        grnNumber: input.grnNumber || makeGrnNumber(input.receivedDate),
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ?? null,
        receivedDate: input.receivedDate,
        status: GRN_STATUS.DRAFT,
        inventoryPosted: false,
        totalAmount: input.totalAmount ?? null,
        createdBy: req.user!.userId,
      });
      await grn.save({ session });
      const items = input.items.map(item => new GRNItem({
        ...itemDocumentData(item),
        pharmacyId,
        grnId: grn._id,
      }));
      for (const item of items) await item.save({ session });
      result = { ...grn.toObject(), items: items.map(item => item.toObject()) };
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json({ success: true, message: 'GRN draft created successfully', data: result });
});

export const updateGrn = handler(async (req, res) => {
  const input = normalizeFinancials(grnInput.parse(req.body));
  const filter = grnFilter(req);
  const pharmacyId = getPharmacyId(req);
  const session = await mongoose.startSession();
  let result: Record<string, unknown> | undefined;
  try {
    await session.withTransaction(async () => {
      const existing = await GRN.findOne(filter).session(session);
      if (!existing) throw new GrnRequestError(404, 'GRN not found');
      if (existing.status !== GRN_STATUS.DRAFT) {
        throw new GrnRequestError(409, 'Only DRAFT GRNs can be edited');
      }
      if (req.user!.role === 'STAFF' && String(existing.createdBy) !== req.user!.userId) {
        throw new GrnRequestError(403, 'Staff can only edit GRN drafts they created');
      }
      await validateReferences(input, pharmacyId, session);
      const grn = await GRN.findOneAndUpdate(
        { ...filter, status: GRN_STATUS.DRAFT },
        {
          $set: {
            supplierId: input.supplierId,
            purchaseOrderId: input.purchaseOrderId ?? null,
            ...(input.grnNumber ? { grnNumber: input.grnNumber } : {}),
            invoiceNumber: input.invoiceNumber,
            invoiceDate: input.invoiceDate ?? null,
            receivedDate: input.receivedDate,
            totalAmount: input.totalAmount,
          },
        },
        { new: true, runValidators: true, session }
      );
      if (!grn) throw new GrnRequestError(409, 'Only DRAFT GRNs can be edited');
      await GRNItem.deleteMany({ grnId: grn._id, pharmacyId }).session(session);
      const items = input.items.map(item => new GRNItem({
        ...itemDocumentData(item),
        pharmacyId,
        grnId: grn._id,
      }));
      for (const item of items) await item.save({ session });
      result = { ...grn.toObject(), items: items.map(item => item.toObject()) };
    });
  } finally {
    await session.endSession();
  }
  res.json({ success: true, message: 'GRN draft updated successfully', data: result });
});

export const submitGrn = handler(async (req, res) => {
  const filter = grnFilter(req);
  const pharmacyId = getPharmacyId(req);
  const session = await mongoose.startSession();
  let result: Record<string, unknown> | undefined;
  try {
    await session.withTransaction(async () => {
      const grn = await GRN.findOne(filter).session(session);
      if (!grn) throw new GrnRequestError(404, 'GRN not found');
      if (!canChangeGRNStatus(grn.status, GRN_STATUS.PENDING_VERIFICATION)) {
        throw new GrnRequestError(409, 'Only DRAFT GRNs can be submitted for verification');
      }
      if (!grn.supplierId || !grn.grnNumber || !grn.invoiceNumber || !grn.receivedDate) {
        throw new GrnRequestError(400, 'GRN is missing required header information');
      }
      const items = await loadGrnItems(grn._id, pharmacyId, session);
      if (items.length === 0) throw new GrnRequestError(400, 'At least one GRN item is required');
      for (const item of items) {
        await item.validate();
        const quantities = [
          item.receivedQuantity,
          item.rejectedQuantity,
          item.damagedQuantity,
          item.returnedQuantity,
          item.acceptedQuantity,
        ];
        if (quantities.some(quantity =>
          !Number.isSafeInteger(quantity) || quantity < 0
        )) {
          throw new GrnRequestError(400, 'GRN item quantities must be nonnegative whole numbers');
        }
        if (
          item.rejectedQuantity > item.receivedQuantity ||
          item.damagedQuantity + item.returnedQuantity > item.rejectedQuantity
        ) {
          throw new GrnRequestError(400, 'GRN item rejected quantities are inconsistent');
        }
      }
      await validateReferences({
        supplierId: String(grn.supplierId),
        purchaseOrderId: grn.purchaseOrderId ? String(grn.purchaseOrderId) : undefined,
        grnNumber: grn.grnNumber,
        invoiceNumber: grn.invoiceNumber ?? '',
        invoiceDate: grn.invoiceDate,
        receivedDate: grn.receivedDate,
        totalAmount: grn.totalAmount?.toString(),
        items: items.map(item => ({
          medicineId: String(item.medicineId),
          purchaseOrderItemId: item.purchaseOrderItemId ? String(item.purchaseOrderItemId) : undefined,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          damagedQuantity: item.damagedQuantity,
          returnedQuantity: item.returnedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          rejectionReason: item.rejectionReason,
          unitOfMeasure: item.unitOfMeasure,
          wholesalePrice: item.wholesalePrice?.toString(),
          retailPrice: item.retailPrice?.toString(),
          lineTotal: item.lineTotal?.toString(),
        })),
      }, pharmacyId, session);
      for (const item of items) {
        await item.save({ session });
      }
      const updated = await GRN.findOneAndUpdate(
        { ...filter, status: GRN_STATUS.DRAFT },
        {
          $set: {
            status: GRN_STATUS.PENDING_VERIFICATION,
            submittedAt: new Date(),
            submittedBy: req.user!.userId,
          },
        },
        { new: true, runValidators: true, session }
      );
      if (!updated) throw new GrnRequestError(409, 'Only DRAFT GRNs can be submitted for verification');
      result = { ...updated.toObject(), items: items.map(item => item.toObject()) };
    });
  } finally {
    await session.endSession();
  }
  res.json({ success: true, message: 'GRN submitted for verification', data: result });
});

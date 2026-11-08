import mongoose from 'mongoose';
import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import Supplier from '../models/Supplier';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseOrderItem from '../models/PurchaseOrderItem';
import MedicineCatalog from '../models/MedicineCatalog';
import PharmacyMedicine from '../models/PharmacyMedicine';
import { supplierInput, purchaseOrderInput, objectId, multiplyDecimal, addDecimals, equalDecimals } from '../services/purchasingValidation';

class PurchasingError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function handler(action: (req: AuthRequest, res: Response) => Promise<void>) {
  return async (req: AuthRequest, res: Response): Promise<void> => {
    try { await action(req, res); }
    catch (error) {
      if (error instanceof PurchasingError) {
        res.status(error.status).json({ success: false, message: error.message });
      } else if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
      } else if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
        res.status(400).json({ success: false, message: error.message });
      } else if ((error as { code?: number })?.code === 11000) {
        res.status(409).json({ success: false, message: 'Purchase order number already exists for this pharmacy' });
      } else if ((error as { code?: number })?.code === 20) {
        res.status(503).json({ success: false, message: 'Purchase order creation requires MongoDB transaction support (replica set or mongos)' });
      } else {
        console.error('Purchasing request failed', error);
        res.status(500).json({ success: false, message: 'Unable to complete purchasing request' });
      }
    }
  };
}
const scope = (req: AuthRequest) => ({ pharmacyId: req.user!.pharmacyId });
const recordScope = (req: AuthRequest) => ({ ...scope(req), _id: objectId.parse(req.params.id) });

export const listSuppliers = handler(async (req, res) => {
  const data = await Supplier.find(scope(req)).sort({ supplierName: 1, _id: 1 });
  res.json({ success: true, data });
});
export const getSupplier = handler(async (req, res) => {
  const data = await Supplier.findOne(recordScope(req));
  if (!data) throw new PurchasingError(404, 'Supplier not found');
  res.json({ success: true, data });
});
export const createSupplier = handler(async (req, res) => {
  const data = await Supplier.create({ ...supplierInput.parse(req.body), ...scope(req) });
  res.status(201).json({ success: true, data });
});
export const updateSupplier = handler(async (req, res) => {
  const filter = recordScope(req);
  const input = supplierInput.partial().refine(value => Object.keys(value).length > 0, 'No supplier fields supplied').parse(req.body);
  const data = await Supplier.findOneAndUpdate(filter, { $set: input }, { new: true, runValidators: true });
  if (!data) throw new PurchasingError(404, 'Supplier not found');
  res.json({ success: true, data });
});
export const listPurchaseOrders = handler(async (req, res) => {
  const data = await PurchaseOrder.find(scope(req)).sort({ orderDate: -1, _id: -1 });
  res.json({ success: true, data });
});
export const getPurchaseOrder = handler(async (req, res) => {
  const order = await PurchaseOrder.findOne(recordScope(req));
  if (!order) throw new PurchasingError(404, 'Purchase order not found');
  const items = await PurchaseOrderItem.find({ ...scope(req), purchaseOrderId: order._id });
  res.json({ success: true, data: { ...order.toObject(), items } });
});
export const createPurchaseOrder = handler(async (req, res) => {
  const input = purchaseOrderInput.parse(req.body);
  const pharmacyId = req.user!.pharmacyId;
  const lines = input.items.map(item => {
    const lineTotal = multiplyDecimal(item.unitPurchasePrice, item.orderedQuantity);
    if (item.lineTotal !== undefined && !equalDecimals(item.lineTotal, lineTotal)) {
      throw new PurchasingError(400, 'Item lineTotal does not match quantity and price');
    }
    return { ...item, lineTotal };
  });
  const totalAmount = addDecimals(lines.map(item => item.lineTotal));
  if (input.totalAmount !== undefined && !equalDecimals(input.totalAmount, totalAmount)) {
    throw new PurchasingError(400, 'totalAmount does not match order items');
  }
  // Validate all documents before writes, including Decimal128 representability.
  const order = new PurchaseOrder({
    pharmacyId, supplierId: input.supplierId, purchaseOrderNumber: input.purchaseOrderNumber,
    orderDate: input.orderDate, expectedDeliveryDate: input.expectedDeliveryDate,
    status: input.status, notes: input.notes, totalAmount, createdBy: req.user!.userId,
  });
  const items = lines.map(item => new PurchaseOrderItem({ ...item, pharmacyId, purchaseOrderId: order._id }));
  await order.validate();
  await Promise.all(items.map(item => item.validate()));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const supplier = await Supplier.exists({ _id: input.supplierId, pharmacyId }).session(session);
      if (!supplier) throw new PurchasingError(400, 'Supplier does not belong to this pharmacy');
      const medicineIds = [...new Set(input.items.map(item => item.medicineId.toLowerCase()))];
      const catalogCount = await MedicineCatalog.countDocuments({ _id: { $in: medicineIds } }).session(session);
      const linkedCount = await PharmacyMedicine.countDocuments({ pharmacyId, medicineId: { $in: medicineIds } }).session(session);
      if (catalogCount !== medicineIds.length || linkedCount !== medicineIds.length) {
        throw new PurchasingError(400, 'Each medicine must exist in the catalog and be linked to this pharmacy');
      }
      // withTransaction may retry its callback. Fresh documents keep inserts safe
      // after an aborted attempt has changed a Mongoose document's isNew state.
      await new PurchaseOrder(order.toObject()).save({ session });
      // MongoDB transactions must execute operations sequentially.
      for (const item of items) await new PurchaseOrderItem(item.toObject()).save({ session });
    });
  } finally { await session.endSession(); }
  res.status(201).json({ success: true, data: { ...order.toObject(), items: items.map(item => item.toObject()) } });
});

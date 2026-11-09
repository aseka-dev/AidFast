import { z } from 'zod';
import { GRN_STATUS } from '../constants/grnStatus';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid MongoDB ID');

const optionalObjectId = z.union([objectId, z.literal(''), z.null()])
  .optional()
  .transform(value => value || undefined);

function expandNumber(value: number): string {
  const [mantissa, exponent] = String(value).toLowerCase().split('e');
  if (exponent === undefined) return mantissa;
  const [whole, fraction = ''] = mantissa.split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponent);
  if (point <= 0) return `0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length);
  return `${digits.slice(0, point)}.${digits.slice(point)}`;
}

const decimal = z.union([z.string(), z.number().finite()])
  .transform(value => typeof value === 'number' ? expandNumber(value) : value.trim())
  .refine(value =>
    /^\d+(\.\d+)?$/.test(value) &&
    value.replace('.', '').replace(/^0+/, '').length <= 34,
  'Expected a nonnegative decimal with at most 34 significant digits');

const date = z.string().min(1)
  .refine(value => Number.isFinite(Date.parse(value)), 'Invalid date')
  .transform(value => new Date(value));

const quantity = z.number().finite().int().min(0).max(Number.MAX_SAFE_INTEGER);

const grnItemInput = z.object({
  purchaseOrderItemId: optionalObjectId,
  medicineId: objectId,
  batchNumber: z.string().trim().min(1),
  expiryDate: date,
  orderedQuantity: quantity.optional(),
  receivedQuantity: quantity,
  damagedQuantity: quantity.optional().default(0),
  returnedQuantity: quantity.optional().default(0),
  rejectedQuantity: quantity.optional().default(0),
  rejectionReason: z.string().trim().optional(),
  unitOfMeasure: z.string().trim().optional(),
  wholesalePrice: decimal.optional(),
  retailPrice: decimal.optional(),
  lineTotal: decimal.optional(),
}).superRefine((item, context) => {
  if (item.rejectedQuantity > item.receivedQuantity) {
    context.addIssue({
      code: 'custom',
      path: ['rejectedQuantity'],
      message: 'Rejected quantity cannot exceed received quantity',
    });
  }
  if (item.damagedQuantity + item.returnedQuantity > item.rejectedQuantity) {
    context.addIssue({
      code: 'custom',
      path: ['rejectedQuantity'],
      message: 'Rejected quantity must include damaged and returned units',
    });
  }
});

export const grnInput = z.object({
  supplierId: objectId,
  purchaseOrderId: optionalObjectId,
  grnNumber: z.string().trim().min(1).optional(),
  invoiceNumber: z.string().trim().min(1),
  invoiceDate: date.optional(),
  receivedDate: date,
  totalAmount: decimal.optional(),
  items: z.array(grnItemInput).min(1, 'At least one GRN item is required'),
});

export const grnListQuery = z.object({
  status: z.enum(Object.values(GRN_STATUS) as [string, ...string[]]).optional(),
});

export type GrnInput = z.output<typeof grnInput>;
export type GrnItemInput = GrnInput['items'][number];

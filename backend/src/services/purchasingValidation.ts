import { z } from 'zod';

export const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid MongoDB ID');
export const supplierInput = z.object({
  supplierName: z.string().trim().min(1),
  contact: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

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

// Decimal arithmetic avoids binary floating point errors in stored totals.
const decimal = z.union([z.string(), z.number().finite()])
  .transform(value => typeof value === 'number' ? expandNumber(value) : value)
  .refine(value => /^\d+(\.\d+)?$/.test(value) && value.replace('.', '').replace(/^0+/, '').length <= 34,
    'Expected a nonnegative decimal with at most 34 significant digits');
const date = z.string().min(1).refine(value => Number.isFinite(Date.parse(value)), 'Invalid date');
export const purchaseOrderInput = z.object({
  supplierId: objectId,
  purchaseOrderNumber: z.string().trim().min(1),
  orderDate: date,
  expectedDeliveryDate: date.optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  totalAmount: decimal.optional(),
  items: z.array(z.object({
    medicineId: objectId,
    orderedQuantity: z.number().finite().min(1).max(Number.MAX_SAFE_INTEGER),
    unitPurchasePrice: decimal,
    lineTotal: decimal.optional(),
  })).min(1),
});

function parts(value: string): [bigint, number] {
  const [whole, fraction = ''] = value.split('.');
  return [BigInt(whole + fraction), fraction.length];
}
function format(value: bigint, scale: number): string {
  const digits = value.toString().padStart(scale + 1, '0');
  return scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
}
export function multiplyDecimal(price: string, quantity: number): string {
  const [a, aScale] = parts(price);
  // Expand scientific notation produced by very small/large numeric quantities.
  const quantityString = expandNumber(quantity);
  const [b, bScale] = parts(quantityString);
  return format(a * b, aScale + bScale);
}
export function addDecimals(values: string[]): string {
  const entries = values.map(parts);
  const scale = Math.max(...entries.map(([, length]) => length));
  return format(entries.reduce((sum, [n, length]) => sum + n * 10n ** BigInt(scale - length), 0n), scale);
}
export function equalDecimals(a: string, b: string): boolean {
  const [x, xs] = parts(a);
  const [y, ys] = parts(b);
  return x * 10n ** BigInt(ys) === y * 10n ** BigInt(xs);
}

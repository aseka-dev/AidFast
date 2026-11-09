export interface GrnItem {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  rejectedQuantity: number;
  wholesalePrice: number;
}

export const emptyItem = (): GrnItem => ({
  medicineId: '',
  batchNumber: '',
  expiryDate: '',
  receivedQuantity: 0,
  damagedQuantity: 0,
  returnedQuantity: 0,
  rejectedQuantity: 0,
  wholesalePrice: 0
});

export const accepted = (item: GrnItem): number =>
  item.receivedQuantity - item.rejectedQuantity;

export const calculateGrnTotal = (items: GrnItem[]): number =>
  items.reduce(
    (sum, item) => sum + accepted(item) * item.wholesalePrice,
    0
  );

export const referenceId = (
  value?: string | { _id: string } | null
): string => {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id;
};

export const formatGrnStatus = (status: string): string =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatGrnDate = (value?: string): string => {
  if (!value) return '—';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-GB');
};

export const responseRecords = <T,>(
  result: unknown,
  key: string
): T[] | null => {
  if (Array.isArray(result)) return result as T[];
  if (!result || typeof result !== 'object') return null;

  const data = (result as { data?: unknown }).data;
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return null;

  const records = (data as Record<string, unknown>)[key];
  return Array.isArray(records) ? records as T[] : null;
};
